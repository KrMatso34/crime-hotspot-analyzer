import bcrypt from 'bcrypt';
import { findAccountByUsername, addAccount, updateAccountAddress } from '../util/dynamo.js'

/*
const accounts = []; 

async function generateID() {
    return crypto.randomUUID();
}

async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function findAccountByUsername(username) {
    return accounts.find(account => account.username.toLowerCase() === username.toLowerCase()) || null;
}

async function findAccountById(id) {
    return accounts.find(account => account.id === Number(id)) || null;
}

async function addAccount(username, password) {
    const existingUser = await findAccountByUsername(username);
    if (existingUser) return { success: false, message: "Username taken" };

    const hashedPassword = await hashPassword(password);
    const id = await generateID();
    
    const newAccount = {
        id,
        username,
        password: hashedPassword,
        savedAddress: ''
    };
    
    accounts.push(newAccount);
    return { success: true, id };
}
 */

export async function validateLogin(req, res) {
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).json({ success: false });

    const account = await findAccountByUsername(username);
    if (!account) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    return res.status(200).json({
        success: true,
        user: {
            id: account.id,
            username: account.username,
            savedAddress: account.savedAddress
        }
    });
}

export async function signUp(req, res) {
    const { username, password } = req.body; 

    if (!username || !password || username.trim() === '') {
        return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const addResult = await addAccount(username, password);
    if (!addResult.success) return res.status(400).json({ success: false, message: addResult.message });

    return res.status(201).json({ success: true, id: addResult.id });
}

export async function updateSavedAddress(req, res) {
    const { id } = req.params;
    const { savedAddress } = req.body;

    // Quick validation check
    if (!id || savedAddress === undefined) {
        return res.status(400).json({ 
            success: false, 
            message: "Missing required fields: id or savedAddress" 
        });
    }

    try {
        await updateAccountAddress(id, savedAddress);
        
        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error: Failed to update address in cloud." 
        });
    }
}