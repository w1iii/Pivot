
export async function checkLogin(username: string, password: string){
    if(username === "admin" && password === "123"){
        return { success: true};
    }
    return { success: false};
}
