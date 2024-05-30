import express, { Request, Response, Router } from "express";
import { Contact, UserInput } from "../interfaces/userInput-interface";
import dotenv from "dotenv";
dotenv.config();

import db, { findAllById, findByUserInfo, findSimilar, insertNewContact, updateContact } from '../database/database'

const router: Router = express.Router();
// APIS

// get all from contacts
router.get('/contact', (req: Request, res: Response) => {
    db.all('SELECT * FROM contact', (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(200).send(rows);
    });
});

// new contact
router.post('/contact',async (req: Request, res: Response) => {
    const { phoneNumber, email, linkedId, linkPrecedence, createAt, updatedAt, deletedAt } = req.body;
    try {
        const result = await insertNewContact(phoneNumber, email, linkedId, linkPrecedence, new Date(createAt), new Date(updatedAt), deletedAt ? new Date(deletedAt) : null);
        res.status(200).send(result);   
    } catch (error: Error | any) {
        console.error('Failed to insert new contact:', error);
        res.status(500).send({ error: error.message });
    }
});

// find one contact by email or phoneNumber
router.post('/one-contact', async (req: Request, res: Response)=>{
    const { email, phoneNumber } = req.body;
    try {
        const result = await findByUserInfo(email, phoneNumber);
        res.status(200).send(result)
    }catch(error: Error | any){
        console.error('Failed to find contact:', error);
        res.status(500).send({ error: error.message });
    }
})

// edit one contact
router.patch('/one-contact', async (req: Request, res:Response)=>{
    try {
        const result = await updateContact(req.body);
        
        res.status(200).send(result);   
    } catch (error: Error | any) {
        console.error('Failed to insert new contact:', error);
        res.status(500).send({ error: error.message });
    }
})

// find-similar contacts
router.post('/find-similar', async (req: Request, res:Response)=>{
    const { email, phoneNumber } = req.body;
    try {
        const result = await findSimilar(email, phoneNumber);
        res.status(200).send(result)
    }catch(error: Error | any){
        console.error('Failed to find contact:', error);
        res.status(500).send({ error: error.message });
    }
})


// Identify Route
router.post('/', async (req: Request, res: Response)=>{
    const { email , phoneNumber } = req.body
    try {
        var result: any = {
            "contact":{
                "primaryContactId": null,
                "emails": [],
                "phoneNumbers": [],
                "secondaryContactIds": []
                }
        }
        const data: any = await findByUserInfo(email,phoneNumber)
        
        if(data.length == 0){
            // it is unique and must be added
            var output = await insertNewContact(phoneNumber, email, null, "primary", new Date(), new Date(), null)
            
            result.contact.primaryContactId = output.id
            result.contact.emails.push(output.email)
            result.contact.phoneNumbers.push(output.phoneNumber)

            return res.status(200).send(result)
        }
        else{
            const output = await findSimilar(email, phoneNumber);
            
            handleMiscellaneous(output)
            // creating summary
            output.forEach((obj)=>{

                if(obj.linkPrecedence.toLowerCase() == 'primary' ){
                    result.contact.primaryContactId = obj.id
                    if(!result.contact.emails.includes(obj.email)){
                        result.contact.emails.push(obj.email)
                    }
                    if(!result.contact.phoneNumbers.includes(obj.phoneNumber)){
                        result.contact.phoneNumbers.push(obj.phoneNumber)
                    }
                }
                else {
                    if(!result.contact.emails.includes(obj.email)){
                        result.contact.emails.push(obj.email)
                    }
                    if(!result.contact.phoneNumbers.includes(obj.phoneNumber)){
                        result.contact.phoneNumbers.push(obj.phoneNumber)
                    }
                    if(!result.contact.secondaryContactIds.includes(obj.id)){
                        result.contact.secondaryContactIds.push(obj.id)
                    }
                }
            })

            // checking is there some unique information we are receiving , if yes then inserting
            if(!result.contact.phoneNumbers.includes(phoneNumber) || !result.contact.emails.includes(email)){
                const temp = await insertNewContact(phoneNumber, email, result.contact.primaryContactId, "secondary", new Date(), new Date(), null)

                if(!result.contact.emails.includes(email)){
                    result.contact.emails.push(email)
                }
                if(!result.contact.phoneNumbers.includes(phoneNumber)){
                    result.contact.phoneNumbers.push(phoneNumber)
                }
                result.contact.secondaryContactIds.push(temp.id)

            }

            return res.status(200).send(result)
        }
    }catch(error: any){
        res.status(500).send(error?.message)
    }
    
    

    res.status(200).send({message : "under development"})
})

// data is output of findSimilar
async function handleMiscellaneous(data: Contact[]){
    const primaryObjects: Contact[] = data.filter((obj: Contact)=>obj.linkPrecedence.toLowerCase() == 'primary')
    if(primaryObjects.length > 1){
        var oldestObject: Contact = primaryObjects[0];
        var newestObject: Contact = primaryObjects[1];
        if(new Date(primaryObjects[0].createAt) < new Date(primaryObjects[1].createAt)){
            oldestObject = primaryObjects[0]
            newestObject = primaryObjects[1]
        }
        else{
            oldestObject = primaryObjects[1]
            newestObject = primaryObjects[0]
        }

        var newestObjectTree = await findSimilar(newestObject.email, newestObject.phoneNumber)

        for(var i=0;i<newestObjectTree.length;i++){
            if(newestObjectTree[i].linkPrecedence.toLowerCase()=='primary'){
                newestObjectTree[i].linkPrecedence = 'secondary'
            }
            newestObjectTree[i].linkedId = oldestObject.id
            await updateContact(newestObjectTree[i])
        }
    }
}


module.exports = router;