const chalk = require('chalk')
const yargs = require('yargs')
const getNotes = require('./notes.js')

// Customize yrags version
yargs.version('1.1.0')

// Create add command
yargs.command({
    command: 'add',
    describe: 'Add new note',
    handler: function () {
        console.log('Adding new note!')
    }
})

// Create remove command
yargs.command({
    command: 'remove',
    describe: 'Remove a note',
    handler: function () {
        console.log('Removing the note!')
    }
})

// Create list command
yargs.command({
    command: 'list',
    describe: 'List of notes',
    handler: function () {
        console.log('List of notes!')
    }
})

// Create read command
yargs.command({
    command: 'read',
    describe: 'Read a note',
    handler: function () {
        console.log('Reading a note!')
    }
})

// add, remove, READ, LIST

console.log(yargs.argv)
