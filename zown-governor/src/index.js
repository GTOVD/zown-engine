const fs = require('fs');
const path = require('path');

class Governor {
    constructor(options = {}) {
        this.stateFile = options.stateFile || path.join(process.cwd(), 'state.json');
        
        // Priority Weights
        this.PRIORITY_MAP = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        
        // Usage Estimates (Requests per action) - could be config, keeping hardcoded for now
        this.COSTS = {
            'chat': 1,
            'agent_turn': 5,
            'heartbeat': 1,
            'cron_job': 3
        };

        // TPM Limits (1M TPM default for Gemini)
        this.TPM_LIMIT = 1000000;
        this.TPM_THRESHOLD = 0.9; // Pause at 90%
    }

    loadState() {
        if (!fs.existsSync(this.stateFile)) return null;
        try {
            return JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
        } catch (e) {
            console.error("Error reading state file:", e);
            return null;
        }
    }

    saveState(state) {
        fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    }

    isWeekend() {
        const day = new Date().getDay();
        return day === 0 || day === 6; // 0=Sun, 6=Sat
    }

    getPredictedUserUsage(config) {
        // Base usage assumption (requests per hour)
        let baseUsage = 10; 

        // 1. Day of Week Factor
        const dayFactor = this.isWeekend() ? 
            (config.userProfile?.weekendFactor || 2.0) : 
            (config.userProfile?.weekdayFactor || 0.5);
        
        // 2. Monthly Trend Factor
        let monthFactor = 1.0;
        if (config.userProfile?.monthlyTrend === 'low_dev') monthFactor = 0.5;
        if (config.userProfile?.monthlyTrend === 'high_dev') monthFactor = 1.5;

        return baseUsage * dayFactor * monthFactor;
    }

    // Helper to handle time-boundary resets (day/hour/minute)
    _checkReset(state) {
        const now = new Date();
        const lastReset = new Date(state.config.currentUsage.lastReset);
        let dirty = false;

        // Daily Reset
        if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
            state.config.currentUsage.today = 0;
            state.config.currentUsage.thisHour = 0;
            state.config.currentUsage.thisMinute = 0;
            state.config.currentUsage.tpmUsed = 0;
            state.config.currentUsage.lastReset = now.toISOString();
            dirty = true;
        } 
        // Hourly Reset
        else if (now.getHours() !== lastReset.getHours()) {
            state.config.currentUsage.thisHour = 0;
            state.config.currentUsage.thisMinute = 0; 
            state.config.currentUsage.tpmUsed = 0;
            state.config.currentUsage.lastReset = now.toISOString();
            dirty = true;
        }
        // Minute Reset (Rolling-ish)
        else if (now.getTime() - lastReset.getTime() > 60000) {
            state.config.currentUsage.thisMinute = 0;
            state.config.currentUsage.tpmUsed = 0;
            state.config.currentUsage.lastReset = now.toISOString();
            dirty = true;
        }
        
        return dirty;
    }

    getDynamicStatus(state) {
        if (!state) state = this.loadState();
        if (!state) return { status: 'RED', autonomyBudget: 0, error: "State not loaded" };

        const dirty = this._checkReset(state);
        if (dirty) this.saveState(state);

        const { today, thisHour, thisMinute, tpmUsed } = state.config.currentUsage;
        const { dailyLimit, hourlyLimit, rpmLimit } = state.config;

        // Hard Caps (API Limits)
        if (today >= dailyLimit) return { status: 'RED', reason: 'daily_limit', autonomyBudget: 0 };
        if (thisHour >= hourlyLimit) return { status: 'RED', reason: 'hourly_limit', autonomyBudget: 0 };
        
        // TPM Protection
        if (tpmUsed >= (this.TPM_LIMIT * this.TPM_THRESHOLD)) {
            return { status: 'RED', reason: 'tpm_safeguard', autonomyBudget: 0, waitSeconds: 60 };
        }

        // Burst Protection (RPM)
        if (thisMinute >= (rpmLimit || 25)) {
            return { status: 'RED', reason: 'rpm_burst_limit', autonomyBudget: 0, waitSeconds: 60 };
        }

        // Dynamic Budgeting
        const predictedUser = this.getPredictedUserUsage(state.config);
        const autonomyBudget = Math.max(0, hourlyLimit - thisHour - predictedUser);

        // Status Determination
        if (autonomyBudget <= 0) {
            return { status: 'RED', reason: 'user_reserve', autonomyBudget };
        } else if (autonomyBudget < 5) {
            return { status: 'YELLOW', reason: 'low_budget', autonomyBudget };
        } else {
            return { status: 'GREEN', reason: 'good', autonomyBudget };
        }
    }

    incrementUsage(amount = 1, tokens = 0) {
        const state = this.loadState();
        if (!state) return;

        // Ensure we reset boundaries before incrementing
        this._checkReset(state);

        state.config.currentUsage.today += amount;
        state.config.currentUsage.thisHour += amount;
        if (!state.config.currentUsage.thisMinute) state.config.currentUsage.thisMinute = 0;
        state.config.currentUsage.thisMinute += amount;
        
        if (!state.config.currentUsage.tpmUsed) state.config.currentUsage.tpmUsed = 0;
        state.config.currentUsage.tpmUsed += tokens;

        state.config.currentUsage.lastReset = new Date().toISOString(); 
        
        this.saveState(state);
    }

    getNextTask() {
        const state = this.loadState();
        if (!state) return { error: "State file missing" };

        const { status, autonomyBudget } = this.getDynamicStatus(state);

        if (status === 'RED') {
            return { error: "RATE_LIMIT_EXCEEDED", status: "RED" };
        }

        // Filter pending tasks
        let tasks = state.backlog.filter(t => t.status === 'pending');

        // Filter by Priority based on Status/Budget
        if (status === 'YELLOW' || autonomyBudget < 10) {
            // Conservative: Only Critical/High
            tasks = tasks.filter(t => this.PRIORITY_MAP[t.priority] >= 3);
        }

        // Sort by Priority then ID
        tasks.sort((a, b) => {
            const pDiff = (this.PRIORITY_MAP[b.priority] || 1) - (this.PRIORITY_MAP[a.priority] || 1);
            if (pDiff !== 0) return pDiff;
            return a.id.localeCompare(b.id);
        });

        // Pick top task
        if (tasks.length > 0) {
            const task = tasks[0];
            task.status = 'in_progress';
            task.startedAt = new Date().toISOString();
            this.saveState(state);
            this.incrementUsage(1); 
            return { ...task, systemStatus: status, budget: autonomyBudget };
        }

        // FILLER LOGIC
        if (status === 'GREEN' && autonomyBudget > 5) {
            // Auto-Generate "Hourly Pulse"
            const lastPulseTime = new Date(state.config.lastPulseAt || 0);
            const hoursSincePulse = (new Date() - lastPulseTime) / (1000 * 60 * 60);
            
            if (hoursSincePulse > 1) {
                 this.incrementUsage(1);
                 state.config.lastPulseAt = new Date().toISOString();
                 this.saveState(state);
                 return {
                    id: `auto-pulse-${Date.now()}`,
                    title: "Hourly Devlog Pulse",
                    priority: "medium",
                    type: "pulse",
                    description: "Write a short, stream-of-consciousness update to devlog/posts/ about current thoughts, progress, or system status.",
                    systemStatus: "GREEN",
                    budget: autonomyBudget
                };
            }

            this.incrementUsage(1);
            return {
                id: `auto-${Date.now()}`,
                title: "System Maintenance / Reflection",
                priority: "low",
                type: "filler",
                description: "Perform a quick health check or memory organization.",
                systemStatus: "GREEN",
                budget: autonomyBudget
            };
        }

        return { message: "No tasks", status, budget: autonomyBudget };
    }

    getTasks(statusFilter = null) {
        const state = this.loadState();
        if (!state) return [];
        
        if (statusFilter) {
            return state.backlog.filter(t => t.status === statusFilter);
        }
        return state.backlog;
    }

    completeTask(id, result) {
        const state = this.loadState();
        if (!state) return false;

        const taskIndex = state.backlog.findIndex(t => t.id === id);
        
        if (taskIndex !== -1) {
            state.backlog[taskIndex].status = 'completed';
            state.backlog[taskIndex].completedAt = new Date().toISOString();
            if (result) state.backlog[taskIndex].result = result;
            this.saveState(state);
            return true;
        }
        return false;
    }

    failTask(id, reason) {
        const state = this.loadState();
        if (!state) return false;

        const taskIndex = state.backlog.findIndex(t => t.id === id);
        
        if (taskIndex !== -1) {
            state.backlog[taskIndex].status = 'failed';
            state.backlog[taskIndex].failedAt = new Date().toISOString();
            state.backlog[taskIndex].failureReason = reason || "No reason provided";
            this.saveState(state);
            return true;
        }
        return false;
    }

    addTask(title, priority = 'medium', description = '') {
        const state = this.loadState();
        if (!state) return { error: "State file missing" };

        if (!Object.keys(this.PRIORITY_MAP).includes(priority)) {
            return { error: `Invalid priority: ${priority}. Must be one of: ${Object.keys(this.PRIORITY_MAP).join(', ')}` };
        }

        const newTask = {
            id: `task-${Date.now()}`,
            title,
            priority,
            description,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        state.backlog.push(newTask);
        this.saveState(state);
        return newTask;
    }

    updateTask(id, updates) {
        const state = this.loadState();
        if (!state) return false;

        const taskIndex = state.backlog.findIndex(t => t.id === id);
        
        if (taskIndex !== -1) {
            if (updates.priority && !Object.keys(this.PRIORITY_MAP).includes(updates.priority)) {
                return false; 
            }

            // Only allow updating certain fields
            const allowedFields = ['title', 'priority', 'description', 'status'];
            let updated = false;
            
            for (const key of Object.keys(updates)) {
                if (allowedFields.includes(key)) {
                    state.backlog[taskIndex][key] = updates[key];
                    updated = true;
                }
            }
            
            if (updated) {
                state.backlog[taskIndex].updatedAt = new Date().toISOString();
                this.saveState(state);
                return state.backlog[taskIndex];
            }
        }
        return false;
    }

    deleteTask(id) {
        const state = this.loadState();
        if (!state) return false;

        const initialLength = state.backlog.length;
        state.backlog = state.backlog.filter(t => t.id !== id);
        
        if (state.backlog.length < initialLength) {
            this.saveState(state);
            return true;
        }
        return false;
    }

    init(options = {}) {
        if (fs.existsSync(this.stateFile)) {
            return { message: "State file already exists", path: this.stateFile };
        }
        
        const defaultState = {
            config: {
                dailyLimit: 250,
                hourlyLimit: 20,
                rpmLimit: 25,
                currentUsage: {
                    today: 0,
                    thisHour: 0,
                    thisMinute: 0,
                    lastReset: new Date().toISOString()
                },
                userProfile: {
                    weekendFactor: 2.0,
                    weekdayFactor: 0.5,
                    monthlyTrend: "neutral"
                }
            },
            backlog: []
        };
        this.saveState(defaultState);
        return { message: "Initialized new state file", path: this.stateFile };
    }
}

module.exports = Governor;
