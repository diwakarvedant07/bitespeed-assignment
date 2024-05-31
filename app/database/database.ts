// db.ts
import sqlite3 from 'sqlite3';
import { Contact } from '../interfaces/userInput-interface';

// Create a database connection
const db = new sqlite3.Database('./mydatabase.db');

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

export function insertNewContact(
    phoneNumber : string,
    email : string,
    linkedId: number | null,
    linkPrecedence : string,
    createAt : Date,
    updatedAt : Date,
    deletedAt : Date | null
): Promise<
{ 
    id: number, 
    phoneNumber: string, 
    email: string, 
    linkedId: number | null, 
    linkPrecedence: string, 
    createAt: Date, 
    updatedAt: Date, 
    deletedAt: Date | null 
}>{
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createAt, updatedAt, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [phoneNumber, email, linkedId, linkPrecedence, createAt.toISOString(), updatedAt.toISOString(), deletedAt ? deletedAt.toISOString() : null],
            function (err) {
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
            }
        );
    });
}

export function updateContact(
    input: Contact // Allowing deletedAt to be nullable
): Promise<{ id: number | null, phoneNumber: string, email: string, linkedId: number | null, linkPrecedence: string, updatedAt: Date, deletedAt: Date | null }> {
    const {id, phoneNumber, email, linkedId, linkPrecedence, updatedAt, deletedAt} = input
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE Contact SET phoneNumber = ?, email = ?, linkedId = ?, linkPrecedence = ?, updatedAt = ?, deletedAt = ? WHERE id = ?',
            [phoneNumber, email, linkedId, linkPrecedence, new Date(updatedAt).toISOString(), deletedAt ? deletedAt.toISOString() : null, id],
            function (err) {
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
            }
        );
    });
}

export function findAllById(Id: number | null) : Promise<any[]>{
    return new Promise((resolve,reject)=>{
        db.all('Select * from Contact where linkedId = ? or id = ?',[Id,Id], function (err, rows) {
                if (err) {
                    console.error('Error updating contact:', err);
                    return reject(new Error(String(err)));
                }
                resolve(rows);
            }
        )
    })
}

export function findByUserInfo(email: string, phoneNumber: string) : Promise<Contact>{
        return new Promise((resolve, reject) => {
            db.all(
                'Select * from Contact where email = ? or phoneNumber = ?',
                [email,phoneNumber],
                function (err: any, row: Contact) {
                    if (err) {
                        console.error('Error inserting user:', err);
                        return reject(new Error(String(err)));
                    }
                    resolve(row);
                }
            );
        });
}

export function findSimilar(email: string, phoneNumber: string): Promise<Contact[]>{
    return new Promise(async (resolve,reject)=>{
        var output: Contact[] = []
        const result: any = await findByUserInfo(email, phoneNumber);
        
        var primaryObjects: any =[]

        for(let i=0; i< result.length; i++){
            if(!primaryObjects.includes(result[i].linkedId)){
                primaryObjects.push(result[i].linkedId)
            }
            if(result[i].linkPrecedence.toLowerCase() == 'primary'){
                if(!primaryObjects.includes(result[i].id)){
                    primaryObjects.push(result[i].id)
                }
            }
        }

        //var primaryObjects = result.filter((obj: Contact)=>obj.linkPrecedence.toLowerCase() == 'primary')
        // console.log("primary objects", primaryObjects)

        for(var i=0; i< primaryObjects.length; i++){
            var data = await findAllById(primaryObjects[i])
            output = output.concat(data)
        }

        if(primaryObjects.length == 0){
            var data = await findAllById(result[0].linkedId)
            output = output.concat(data)
        }
        
        resolve(output)
    })
}

export function findExactlySameContactInfo(email: string, phoneNumber: string): Promise<boolean>{
    return new Promise((resolve, reject) => {
        db.all(
            'Select * from Contact where email = ? and phoneNumber = ? limit 1',
            [email,phoneNumber],
            function (err: any, row: Contact[]) {
                if (err) {
                    console.error('Error inserting user:', err);
                    return reject(new Error(String(err)));
                }
                if(row.length == 0){
                    resolve(false);
                }
                else{
                    resolve(true);
                }  
            }
        );
    });
}


export default db;
