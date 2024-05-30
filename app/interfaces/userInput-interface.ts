
export interface UserInput {
    email: string;
    phoneNumber: string;
}

export interface Contact {
    id: number | null, 
    phoneNumber: string, 
    email: string, 
    linkedId: number | null, 
    linkPrecedence: string, 
    createAt: Date, 
    updatedAt: Date, 
    deletedAt: Date | null 
}