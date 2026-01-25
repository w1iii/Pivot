
export async function checkLogin(email: string, password: string){
    if(email === "admin@email.com" && password === "123"){
        return { success: true};
    }
    return { success: false};
}
