"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const database_1 = __importStar(require("../database/database"));
const router = express_1.default.Router();
// APIS
// get all from contacts
router.get('/contact', (req, res) => {
    database_1.default.all('SELECT * FROM contact', (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(200).send(rows);
    });
});
// new contact
router.post('/contact', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, email, linkedId, linkPrecedence, createAt, updatedAt, deletedAt } = req.body;
    try {
        const result = yield (0, database_1.insertNewContact)(phoneNumber, email, linkedId, linkPrecedence, new Date(createAt), new Date(updatedAt), deletedAt ? new Date(deletedAt) : null);
        res.status(200).send(result);
    }
    catch (error) {
        console.error('Failed to insert new contact:', error);
        res.status(500).send({ error: error.message });
    }
}));
// find one contact by email or phoneNumber
router.post('/one-contact', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phoneNumber } = req.body;
    try {
        const result = yield (0, database_1.findByUserInfo)(email, phoneNumber);
        res.status(200).send(result);
    }
    catch (error) {
        console.error('Failed to find contact:', error);
        res.status(500).send({ error: error.message });
    }
}));
// edit one contact
router.patch('/one-contact', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, database_1.updateContact)(req.body);
        res.status(200).send(result);
    }
    catch (error) {
        console.error('Failed to insert new contact:', error);
        res.status(500).send({ error: error.message });
    }
}));
// find-similar contacts
router.post('/find-similar', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phoneNumber } = req.body;
    try {
        const result = yield (0, database_1.findSimilar)(email, phoneNumber);
        res.status(200).send(result);
    }
    catch (error) {
        console.error('Failed to find contact:', error);
        res.status(500).send({ error: error.message });
    }
}));
// Identify Route
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phoneNumber } = req.body;
    try {
        var result = {
            "contact": {
                "primaryContactId": null,
                "emails": [],
                "phoneNumbers": [],
                "secondaryContactIds": []
            }
        };
        const data = yield (0, database_1.findByUserInfo)(email, phoneNumber);
        if (data.length == 0) {
            // it is unique and must be added
            var output = yield (0, database_1.insertNewContact)(phoneNumber, email, null, "primary", new Date(), new Date(), null);
            result.contact.primaryContactId = output.id;
            result.contact.emails.push(output.email);
            result.contact.phoneNumbers.push(output.phoneNumber);
            return res.status(200).send(result);
        }
        else {
            const output = yield (0, database_1.findSimilar)(email, phoneNumber);
            handleMiscellaneous(output);
            // creating summary
            output.forEach((obj) => {
                if (obj.linkPrecedence.toLowerCase() == 'primary') {
                    result.contact.primaryContactId = obj.id;
                    if (!result.contact.emails.includes(obj.email)) {
                        result.contact.emails.push(obj.email);
                    }
                    if (!result.contact.phoneNumbers.includes(obj.phoneNumber)) {
                        result.contact.phoneNumbers.push(obj.phoneNumber);
                    }
                }
                else {
                    if (!result.contact.emails.includes(obj.email)) {
                        result.contact.emails.push(obj.email);
                    }
                    if (!result.contact.phoneNumbers.includes(obj.phoneNumber)) {
                        result.contact.phoneNumbers.push(obj.phoneNumber);
                    }
                    if (!result.contact.secondaryContactIds.includes(obj.id)) {
                        result.contact.secondaryContactIds.push(obj.id);
                    }
                }
            });
            // checking is there some unique information we are receiving , if yes then inserting
            if (!result.contact.phoneNumbers.includes(phoneNumber) || !result.contact.emails.includes(email)) {
                const temp = yield (0, database_1.insertNewContact)(phoneNumber, email, result.contact.primaryContactId, "secondary", new Date(), new Date(), null);
                if (!result.contact.emails.includes(email)) {
                    result.contact.emails.push(email);
                }
                if (!result.contact.phoneNumbers.includes(phoneNumber)) {
                    result.contact.phoneNumbers.push(phoneNumber);
                }
                result.contact.secondaryContactIds.push(temp.id);
            }
            return res.status(200).send(result);
        }
    }
    catch (error) {
        res.status(500).send(error === null || error === void 0 ? void 0 : error.message);
    }
    res.status(200).send({ message: "under development" });
}));
// data is output of findSimilar
function handleMiscellaneous(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const primaryObjects = data.filter((obj) => obj.linkPrecedence.toLowerCase() == 'primary');
        if (primaryObjects.length > 1) {
            var oldestObject = primaryObjects[0];
            var newestObject = primaryObjects[1];
            if (new Date(primaryObjects[0].createAt) < new Date(primaryObjects[1].createAt)) {
                oldestObject = primaryObjects[0];
                newestObject = primaryObjects[1];
            }
            else {
                oldestObject = primaryObjects[1];
                newestObject = primaryObjects[0];
            }
            var newestObjectTree = yield (0, database_1.findSimilar)(newestObject.email, newestObject.phoneNumber);
            for (var i = 0; i < newestObjectTree.length; i++) {
                if (newestObjectTree[i].linkPrecedence.toLowerCase() == 'primary') {
                    newestObjectTree[i].linkPrecedence = 'secondary';
                }
                newestObjectTree[i].linkedId = oldestObject.id;
                yield (0, database_1.updateContact)(newestObjectTree[i]);
            }
        }
    });
}
module.exports = router;
