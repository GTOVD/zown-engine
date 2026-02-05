#!/usr/bin/env node

const { Command } = require('commander');
const Governor = require('../src/index.js');
const path = require('path');

const program = new Command();
const governor = new Governor();

program
  .name('zown-governor')
  .description('An agentic governance tool for budget optimization and task management.')
  .version('1.0.0');

program.command('init')
  .description('Initialize the governor state file')
  .action(() => {
    console.log(JSON.stringify(governor.init(), null, 2));
  });

program.command('status')
  .description('Get the current dynamic status (GREEN/YELLOW/RED)')
  .action(() => {
    console.log(JSON.stringify(governor.getDynamicStatus(), null, 2));
  });

program.command('log <n>')
  .description('Log usage (increment counters)')
  .action((n) => {
    governor.incrementUsage(parseInt(n || 1));
    console.log('Usage logged.');
  });

program.command('next')
  .description('Get the next task based on priority and budget')
  .action(() => {
    console.log(JSON.stringify(governor.getNextTask(), null, 2));
  });

program.command('list')
  .description('List tasks')
  .argument('[status]', 'Filter by status (pending, in_progress, completed, failed)')
  .action((status) => {
    console.log(JSON.stringify(governor.getTasks(status), null, 2));
  });

program.command('add')
  .description('Add a new task')
  .argument('<title>', 'Task title')
  .argument('[priority]', 'Task priority (low, medium, high, critical)', 'medium')
  .argument('[description]', 'Task description', '')
  .action((title, priority, description) => {
    console.log(JSON.stringify(governor.addTask(title, priority, description), null, 2));
  });

program.command('complete')
  .description('Mark a task as completed')
  .argument('<id>', 'Task ID')
  .argument('[result]', 'Result summary', 'Done')
  .action((id, result) => {
    if (governor.completeTask(id, result)) {
      console.log(`Task ${id} marked completed.`);
    } else {
      console.error(`Task ${id} not found.`);
    }
  });

program.command('fail')
  .description('Mark a task as failed')
  .argument('<id>', 'Task ID')
  .argument('[reason]', 'Failure reason', 'Failed')
  .action((id, reason) => {
    if (governor.failTask(id, reason)) {
      console.log(`Task ${id} marked failed.`);
    } else {
      console.error(`Task ${id} not found.`);
    }
  });

program.command('update')
  .description('Update a task')
  .argument('<id>', 'Task ID')
  .option('-t, --title <title>', 'New title')
  .option('-p, --priority <priority>', 'New priority')
  .option('-d, --description <description>', 'New description')
  .option('-s, --status <status>', 'New status')
  .action((id, options) => {
      const updates = {};
      if (options.title) updates.title = options.title;
      if (options.priority) updates.priority = options.priority;
      if (options.description) updates.description = options.description;
      if (options.status) updates.status = options.status;
      
      const result = governor.updateTask(id, updates);
      if (result) {
          console.log(JSON.stringify(result, null, 2));
      } else {
          console.error(`Task ${id} not found or no valid updates provided.`);
      }
  });

program.command('delete')
  .description('Delete a task')
  .argument('<id>', 'Task ID')
  .action((id) => {
      if (governor.deleteTask(id)) {
          console.log(`Task ${id} deleted.`);
      } else {
          console.error(`Task ${id} not found.`);
      }
  });

program.parse();
