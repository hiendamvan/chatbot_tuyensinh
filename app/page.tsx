"use client"
import Image from 'next/image'
import f1GPTLogo from './assets/logo.avif'
import { useChat } from 'ai/react'
import { Message } from 'ai'

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat()
    const noMessages = true
    return (
        <main>
            <Image src={f1GPTLogo} width='250' alt='F1GPT Logo'/>
            <section className={noMessages ? '': "populated"}>
                {noMessages ? (
                    <>  
                        <p className='starter-text'>
                            Ask me anything about volleyball!
                        </p>
                        <br/>
                        {/* <PromptSuggestionRow/> */}
                    </>
                ): (
                    <> 
                        {/* {map messages onto text bubbles } */}
                        {/* { <LoadingBubble/>} */}
                    </>
                )}
                
            </section>
            <form onSubmit={handleSubmit}>
                <input className='question-box' onChange={handleInputChange} value={input} placeholder='Ask me something ...'/>
                <input type='submit'/>
            </form>
        </main>
    )
}
export default Home 