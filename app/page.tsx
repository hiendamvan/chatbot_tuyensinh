"use client"
import Image from 'next/image'
import f1GPTLogo from './assets/logo.avif'
import { useChat } from 'ai/react'
import { Message } from 'ai'
import Bubble from './components/Bubble'
import LoadingBubble from './components/LoadingBubble' 
import PromptSuggestionRow from './components/PromptSuggestionRow'

const Home = () => {
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat()

    const noMessages = false

    const handlePrompt = () => {
    }

    return (
        <main>
            <Image src={f1GPTLogo} width='250' alt='F1GPT Logo'/>
            <section className={noMessages ? '': "populated"}>
                {noMessages ? (
                    <>  
                        <p className='starter-text'>
                            Ask me anything about volleyball ^^!
                        </p>
                        <br/>
                        <PromptSuggestionRow onPromptClick={handlePrompt}/>
                    </>
                ): (
                    <> 
                        {/* {map messages onto text bubbles } */}
                        { messages.map((message, index) => <Bubble key={'message-${index}'} message={message}/>) }
                        { isLoading && <LoadingBubble/>}
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