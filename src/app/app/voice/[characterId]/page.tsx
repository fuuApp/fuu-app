'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCharacter } from '@/lib/characters'

type VoiceState = 'idle'|'recording'|'processing'|'speaking'|'limit_reached'
const NICKNAME_KEY = 'fuu_nickname'
const avatarEmoji: Record<string,string> = { aoi:'👧',sakura:'🌸',rika:'💪',natsuko:'🍵',kenji:'👨',hiroshi:'🧔' }

export default function VoicePage() {
  const params = useParams()
  const router = useRouter()
  const characterId = params.characterId as string
  const character = getCharacter(characterId)
  const nickname = typeof window !== 'undefined' ? localStorage.getItem(NICKNAME_KEY) ?? '' : ''

  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [aiText, setAiText] = useState('')
  const [remainingMin, setRemainingMin] = useState<number|null>(null)
  const [messages, setMessages] = useState<{role:'user'|'assistant';content:string}[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement|null>(null)
  const streamRef = useRef<MediaStream|null>(null)

  useEffect(() => {
    fetch('/api/voice-usage').then(r=>r.json()).then(d=>{
      setRemainingMin(Math.floor((d.remainingSeconds??1800)/60))
      if (!d.canUse) setVoiceState('limit_reached')
    }).catch(()=>setRemainingMin(30))
  }, [])

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t=>t.stop()); audioRef.current?.pause() }, [])

  const startRecording = useCallback(async () => {
    if (voiceState==='limit_reached') return
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true})
      streamRef.current = stream
      const mr = new MediaRecorder(stream, {mimeType:'audio/webm'})
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size>0) chunksRef.current.push(e.data) }
      mr.start(); mediaRecorderRef.current = mr; setVoiceState('recording')
    } catch { setErrorMsg('マイクのアクセスを許可してください') }
  }, [voiceState])

  const stopRecording = useCallback(async () => {
    const mr = mediaRecorderRef.current
    if (!mr||mr.state==='inactive') return
    setVoiceState('processing')
    await new Promise<void>(resolve=>{ mr.onstop=()=>resolve(); mr.stop() })
    streamRef.current?.getTracks().forEach(t=>t.stop())
    const blob = new Blob(chunksRef.current, {type:'audio/webm'})
    const durationSec = Math.ceil(blob.size/16000)
    try {
      const fd = new FormData(); fd.append('file',blob,'audio.webm')
      const sttRes = await fetch('/api/voice/stt',{method:'POST',body:fd})
      let userText = ''
      if (sttRes.ok) { const d=await sttRes.json(); userText=d.text?.trim()??'' }
      if (!userText) { setVoiceState('idle'); setErrorMsg('音声を認識できませんでした。もう一度試してください。'); return }
      setTranscript(userText)
      const newMessages = [...messages,{role:'user' as const,content:userText}]
      setMessages(newMessages)
      const chatRes = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({characterId,message:userText,nickname:nickname||undefined,conversationHistory:newMessages,voice:true})})
      const chatData = await chatRes.json()
      const aiResponse = chatData.message??'ごめん、うまく聞き取れなかった。'
      setAiText(aiResponse); setMessages(prev=>[...prev,{role:'assistant',content:aiResponse}])
      await fetch('/api/voice-usage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({seconds:durationSec})}).then(r=>r.json()).then(d=>{ if (d.remainingSeconds!==undefined) { setRemainingMin(Math.floor(d.remainingSeconds/60)); if (!d.canUse) setVoiceState('limit_reached') } }).catch(()=>{})
      setVoiceState('speaking')
      const ttsRes = await fetch('/api/voice/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:aiResponse,characterId})})
      if (ttsRes.ok) {
        const url = URL.createObjectURL(await ttsRes.blob())
        const audio = new Audio(url); audioRef.current = audio
        audio.onended = () => { URL.revokeObjectURL(url); setVoiceState('idle') }
        audio.play().catch(()=>setVoiceState('idle'))
      } else { setVoiceState('idle') }
    } catch { setErrorMsg('エラーが発生しました。もう一度お試しください。'); setVoiceState('idle') }
  }, [voiceState, messages, characterId, nickname])

  if (!character) return <div style={{ padding:40,textAlign:'center' }}><p>キャラクターが見つかりません</p><button onClick={()=>router.back()}>戻る</button></div>

  const stateLabel: Record<VoiceState,string> = { idle:'押して話す',recording:'聞いてるよ…',processing:'考えてる…',speaking:'話してるよ…',limit_reached:'本日の上限に達しました' }
  const isActive = voiceState==='recording'||voiceState==='speaking'

  return (
    <div style={{ maxWidth:480,margin:'0 auto',background:'linear-gradient(180deg,#fdf4f7 0%,#fff0f7 100%)',minHeight:'100dvh',display:'flex',flexDirection:'column' }}>
      <div style={{ background:'#fff',borderBottom:'1px solid #FCE4EC',padding:'12px 16px',display:'flex',alignItems:'center',gap:12,flexShrink:0 }}>
        <button onClick={()=>{ audioRef.current?.pause(); router.push(`/app/chat/${characterId}`) }} style={{ background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#E91E63',padding:4 }}>‹</button>
        <div style={{ width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#E91E63,#F48FB1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>{avatarEmoji[characterId]??'👩'}</div>
        <div><div style={{ fontWeight:700,fontSize:15,color:'#333' }}>{character.name}</div><div style={{ fontSize:11,color:'#E91E63' }}>音声通話中</div></div>
        {remainingMin!==null && <div style={{ marginLeft:'auto',textAlign:'right' }}><div style={{ fontSize:11,color:'#aaa' }}>残り</div><div style={{ fontSize:16,fontWeight:700,color:remainingMin<=5?'#E91E63':'#555' }}>{remainingMin}分</div></div>}
      </div>

      <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,gap:24 }}>
        <div style={{ position:'relative',display:'flex',alignItems:'center',justifyContent:'center' }}>
          {isActive && <>
            <div style={{ position:'absolute',borderRadius:'50%',width:120,height:120,background:'rgba(233,30,99,0.08)',animation:'pulse 1.5s ease-out infinite' }} />
            <div style={{ position:'absolute',borderRadius:'50%',width:100,height:100,background:'rgba(233,30,99,0.12)',animation:'pulse 1.5s ease-out 0.3s infinite' }} />
          </>}
          <div style={{ width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#E91E63,#F48FB1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:38,boxShadow:'0 4px 20px rgba(233,30,99,0.3)',zIndex:1 }}>{avatarEmoji[characterId]??'👩'}</div>
        </div>
        <div style={{ fontSize:15,color:'#555',fontWeight:500,textAlign:'center',minHeight:24 }}>{stateLabel[voiceState]}</div>
        {(transcript||aiText) && (
          <div style={{ width:'100%',maxWidth:360,display:'flex',flexDirection:'column',gap:10 }}>
            {transcript && <div style={{ alignSelf:'flex-end',background:'linear-gradient(135deg,#E91E63,#C2185B)',color:'#fff',borderRadius:'18px 18px 4px 18px',padding:'10px 16px',fontSize:14,lineHeight:1.6,maxWidth:'85%' }}>{transcript}</div>}
            {aiText && <div style={{ alignSelf:'flex-start',background:'#fff',color:'#333',borderRadius:'18px 18px 18px 4px',padding:'10px 16px',fontSize:14,lineHeight:1.6,maxWidth:'85%',boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>{aiText}</div>}
          </div>
        )}
        {errorMsg && <div style={{ background:'#FFF3F3',border:'1px solid #FFCDD2',borderRadius:12,padding:'10px 16px',fontSize:13,color:'#C62828',textAlign:'center' }}>{errorMsg}</div>}
        {voiceState==='limit_reached' && <div style={{ background:'#FFF8E1',border:'1px solid #FFD54F',borderRadius:12,padding:'12px 16px',fontSize:13,color:'#F57F17',textAlign:'center',lineHeight:1.7 }}>本日の音声通話時間（30分）に達しました。<br />明日またお話しましょう🌙</div>}
      </div>

      <div style={{ padding:'24px 32px 40px',background:'#fff',borderTop:'1px solid #FCE4EC',display:'flex',flexDirection:'column',alignItems:'center',gap:16 }}>
        <button onPointerDown={startRecording} onPointerUp={stopRecording} onPointerLeave={stopRecording}
          disabled={voiceState==='processing'||voiceState==='speaking'||voiceState==='limit_reached'}
          style={{ width:80,height:80,borderRadius:'50%',border:'none',background:voiceState==='recording'?'linear-gradient(135deg,#C2185B,#880E4F)':voiceState==='limit_reached'?'#ddd':'linear-gradient(135deg,#E91E63,#C2185B)',fontSize:32,cursor:voiceState==='limit_reached'?'not-allowed':'pointer',boxShadow:voiceState==='recording'?'0 0 0 8px rgba(233,30,99,0.2)':'0 4px 20px rgba(233,30,99,0.3)',transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center' }}>
          {voiceState==='recording'?'⏹':voiceState==='processing'||voiceState==='speaking'?'⏳':'🎙'}
        </button>
        <p style={{ fontSize:12,color:'#aaa',textAlign:'center',margin:0,lineHeight:1.7 }}>{voiceState==='idle'?'押している間、録音します':voiceState==='recording'?'指を離すと送信します':''}</p>
        <button onClick={()=>{ audioRef.current?.pause(); router.push(`/app/chat/${characterId}`) }} style={{ background:'none',border:'none',fontSize:13,color:'#bbb',cursor:'pointer',textDecoration:'underline',fontFamily:'inherit' }}>テキストで話す</button>
      </div>
      <style>{`@keyframes pulse{0%{transform:scale(0.8);opacity:0.8}100%{transform:scale(1.8);opacity:0}}`}</style>
    </div>
  )
}
