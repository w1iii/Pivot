"use client"

import { useState } from 'react'
import { useEffect } from 'react'


export default function SignUp(){
  const [firstname, setFirst] = useState('')
  const [lastname, setLast] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [contactno, setContact] = useState('')
  const [password, setPasword] = useState('')
  const [confirmpassword, setConfirm] = useState('')


  const handleSubmit = async() => {
    if(password !== confirmpassword){

    }

    const res = await fetch('/api/signup', {
      method: "POST",
      headers: { "Content-Type": "application/json", },
      body: JSON.stringify({ 
        firstname: firstname, 
        lastname: lastname, 
        address: address,
        email: email,
        contactno: contactno,
        password: password,
      })

    })
  }
}
