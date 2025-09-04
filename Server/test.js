
const allowedFields = ["name" , "email", "username", "role", "password"];

let name = "name" 
let password = 'password'; 
let username = 'username'

const updates = { name, password , username}

const data = {}

for(let key of allowedFields){
    if(updates[key] !== undefined){
        data[key] = updates[key]
    }
}

console.log(data); 
