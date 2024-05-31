"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findExactlySameContactInfo = exports.findSimilar = exports.findByUserInfo = exports.findAllById = exports.updateContact = exports.insertNewContact = void 0;
// db.ts
const sqlite3_1 = __importDefault(require("sqlite3"));
// Create a database connection
const db = new sqlite3_1.default.Database('./mydatabase.db');
// Create a table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
);`);
db.run(`CREATE TABLE IF NOT EXISTS Contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phoneNumber TEXT,
    email TEXT,
    linkedId INTEGER,
    linkPrecedence TEXT NOT NULL CHECK (linkPrecedence IN ('primary', 'secondary')),
    createAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    deletedAt DATETIME
);`);
function insertNewContact(phoneNumber, email, linkedId, linkPrecedence, createAt, updatedAt, deletedAt) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createAt, updatedAt, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?)', [phoneNumber, email, linkedId, linkPrecedence, createAt.toISOString(), updatedAt.toISOString(), deletedAt ? deletedAt.toISOString() : null], function (err) {
            if (err) {
                console.error('Error inserting user:', err);
                return reject(new Error(String(err)));
            }
            resolve({
                id: this.lastID,
                phoneNumber,
                email,
                linkedId,
                linkPrecedence,
                createAt,
                updatedAt,
                deletedAt
            });
        });
    });
}
exports.insertNewContact = insertNewContact;
function updateContact(input // Allowing deletedAt to be nullable
) {
    const { id, phoneNumber, email, linkedId, linkPrecedence, updatedAt, deletedAt } = input;
    return new Promise((resolve, reject) => {
        db.run('UPDATE Contact SET phoneNumber = ?, email = ?, linkedId = ?, linkPrecedence = ?, updatedAt = ?, deletedAt = ? WHERE id = ?', [phoneNumber, email, linkedId, linkPrecedence, new Date(updatedAt).toISOString(), deletedAt ? deletedAt.toISOString() : null, id], function (err) {
            if (err) {
                console.error('Error updating contact:', err);
                return reject(new Error(String(err)));
            }
            resolve({
                id,
                phoneNumber,
                email,
                linkedId,
                linkPrecedence,
                updatedAt,
                deletedAt
            });
        });
    });
}
exports.updateContact = updateContact;
function findAllById(Id) {
    return new Promise((resolve, reject) => {
        db.all('Select * from Contact where linkedId = ? or id = ?', [Id, Id], function (err, rows) {
            if (err) {
                console.error('Error updating contact:', err);
                return reject(new Error(String(err)));
            }
            resolve(rows);
        });
    });
}
exports.findAllById = findAllById;
function findByUserInfo(email, phoneNumber) {
    return new Promise((resolve, reject) => {
        db.all('Select * from Contact where email = ? or phoneNumber = ?', [email, phoneNumber], function (err, row) {
            if (err) {
                console.error('Error inserting user:', err);
                return reject(new Error(String(err)));
            }
            resolve(row);
        });
    });
}
exports.findByUserInfo = findByUserInfo;
function findSimilar(email, phoneNumber) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        var output = [];
        const result = yield findByUserInfo(email, phoneNumber);
        var primaryObjects = [];
        result.forEach((obj) => {
            if (!primaryObjects.includes(obj.linkedId)) {
                primaryObjects.push(obj.linkedId);
            }
        });
        //var primaryObjects = result.filter((obj: Contact)=>obj.linkPrecedence.toLowerCase() == 'primary')
        // console.log("primary objects", primaryObjects)
        for (var i = 0; i < primaryObjects.length; i++) {
            var data = yield findAllById(primaryObjects[i]);
            output = output.concat(data);
        }
        if (primaryObjects.length == 0) {
            var data = yield findAllById(result[0].linkedId);
            output = output.concat(data);
        }
        resolve(output);
    }));
}
exports.findSimilar = findSimilar;
function findExactlySameContactInfo(email, phoneNumber) {
    return new Promise((resolve, reject) => {
        db.all('Select * from Contact where email = ? and phoneNumber = ? limit 1', [email, phoneNumber], function (err, row) {
            if (err) {
                console.error('Error inserting user:', err);
                return reject(new Error(String(err)));
            }
            if (row.length == 0) {
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
}
exports.findExactlySameContactInfo = findExactlySameContactInfo;
exports.default = db;
