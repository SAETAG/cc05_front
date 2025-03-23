"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, ArrowLeft, Home, CheckCircle2, Trash2, Archive, FolderOutput, Clock } from "lucide-react"
import { saveStageComplete, updateExperience } from "@/lib/playfab"

export default function Stage2BattlePage() {
  const [isMuted, setIsMuted] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [boxesReady, setBoxesReady] = useState([false, false, false, false])
  const [isSaving, setIsSaving] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const router = useRouter()

  // クライアントサイドでのみ実行されるようにする
  useEffect(() => {
    setIsClient(true)
  }, [])

  // シンプルな音声初期化 - クライアントサイドでのみ実行
  useEffect(() => {
    if (!isClient) return

    try {
      // モバイルでの自動再生制限に対応するため、ユーザーインタラクション前にオーディオを準備するだけにする
      const audioElement = new Audio("/stepfight_2.mp3")
      audioElement.loop = true
      audioElement.volume = 0.7
      audioElement.preload = "auto"

      // オーディオの読み込み状態を監視
      audioElement.addEventListener("canplaythrough", () => {
        setAudioLoaded(true)
        console.log("Audio loaded and ready to play")
      })

      // エラーハンドリングを改善
      audioElement.addEventListener("error", () => {
        console.log("Audio could not be loaded, continuing without sound")
        // エラーが発生してもアプリは続行できるようにする
        setAudioLoaded(false)
      })

      setAudio(audioElement)

      return () => {
        if (audioElement) {
          audioElement.pause()
          audioElement.src = ""
        }
      }
    } catch (error) {
      console.log("Audio initialization error, continuing without sound:", error)
      setAudioLoaded(false)
    }
  }, [isClient])

  // ページ表示後に一度だけ再生を試みる
  useEffect(() => {
    if (!isClient || !audio || !audioLoaded) return

    try {
      // モバイルでは自動再生できないことが多いが、一応試みる
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // エラーは想定内なので何もしない
          console.log("Initial auto-play was prevented, waiting for user interaction")
        })
      }
    } catch (error) {
      console.log("Play attempt failed, continuing without sound")
    }
  }, [audio, audioLoaded, isClient])

  // ミュート状態が変更されたときに適用
  useEffect(() => {
    if (!audio || !isClient || !audioLoaded) return

    try {
      audio.muted = isMuted

      // ミュート解除時に再生を試みる
      if (!isMuted && audio.paused) {
        const playPromise = audio.play()

        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.log("Play on unmute failed, waiting for user interaction")
          })
        }
      }
    } catch (error) {
      console.log("Audio control error, continuing without sound")
    }
  }, [isMuted, audio, audioLoaded, isClient])

  // 画面タップで再生を試みる関数
  const tryPlayAudio = () => {
    if (!audio || !isClient || !audioLoaded) return

    try {
      if (audio.paused && !isMuted) {
        // ユーザーインタラクションの中で再生を試みる（モバイルで重要）
        const playPromise = audio.play()

        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.log("Play on screen tap failed")
          })
        }
      }
    } catch (error) {
      console.log("Play attempt failed, continuing without sound")
    }
  }

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
    tryPlayAudio()
  }

  // Toggle box ready state
  const toggleBoxReady = (index: number) => {
    const newBoxesReady = [...boxesReady]
    newBoxesReady[index] = !newBoxesReady[index]
    setBoxesReady(newBoxesReady)

    // チェックボックス操作時に音声再生を試みる（ユーザーインタラクション）
    tryPlayAudio()
  }

  // Check if all boxes are ready
  const allBoxesReady = boxesReady.every((ready) => ready)

  // Save record to database and navigate to clear page
  const handleComplete = async () => {
    try {
      setIsCompleting(true)
      // ステージクリアデータを保存
      await saveStageComplete(2)
      console.log("ステージ2クリアデータを保存しました")

      router.push("/closet/2/clear")
    } catch (error) {
      console.error("ステージ2クリアデータの保存に失敗:", error)
      alert("クリアデータの保存に失敗しました。もう一度お試しください。")
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-teal-950 flex flex-col" onClick={isClient ? tryPlayAudio : undefined}>
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 via-teal-900 to-purple-900 p-3 flex justify-between items-center border-b-2 border-yellow-500 shadow-md relative">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-yellow-500"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-yellow-500"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-yellow-500"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-yellow-500"></div>

        <div className="flex items-center gap-2">
          <Link href="/closet/2">
            <Button
              variant="outline"
              size="icon"
              className="bg-purple-800 border-yellow-600 text-white hover:bg-purple-700 h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
          <div className="flex items-center">
            <span className="text-lg sm:text-2xl font-bold text-yellow-300 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)] px-2">
              選別の祭壇 - 戦闘フェーズ
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-purple-800 border-yellow-600 text-white hover:bg-purple-700 h-8 w-8 sm:h-10 sm:w-10"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>
          <Link href="/home">
            <Button
              variant="outline"
              size="icon"
              className="bg-purple-800 border-yellow-600 text-white hover:bg-purple-700 h-8 w-8 sm:h-10 sm:w-10"
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center p-4 overflow-auto">
        <div className="max-w-2xl w-full bg-gradient-to-b from-purple-900 to-teal-900 rounded-lg p-6 border-2 border-yellow-500 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-yellow-300 mb-6 text-center">4つの箱を用意しよう</h2>

          <p className="text-white mb-6 text-center">
            箱、袋、またはスペースを4つ用意して、アイテムを分類する準備をしましょう。
            <br />
            用意できたらカードをタップしてチェックを入れてください。
          </p>

          <div className="space-y-6 mb-8">
            {/* 断捨離の箱 */}
            <div
              onClick={() => toggleBoxReady(0)}
              className={`w-full flex items-start space-x-4 bg-gradient-to-r from-red-900 to-red-800 p-5 rounded-lg border-2 ${
                boxesReady[0] ? "border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]" : "border-red-700"
              } shadow-md transition-all duration-300 hover:shadow-lg hover:border-red-600 text-left cursor-pointer`}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <Trash2 className="h-6 w-6 text-red-300 mr-2" />
                  <span className="text-lg font-bold text-yellow-300">「断捨離の箱」</span>
                </div>
                <p className="text-white text-sm mt-1">断捨離の決意により、捨てるもの</p>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 border-yellow-300">
                {boxesReady[0] && <CheckCircle2 className="h-6 w-6 text-green-400" />}
              </div>
            </div>

            {/* 賢者の箱 */}
            <div
              onClick={() => toggleBoxReady(1)}
              className={`w-full flex items-start space-x-4 bg-gradient-to-r from-blue-900 to-blue-800 p-5 rounded-lg border-2 ${
                boxesReady[1] ? "border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]" : "border-blue-700"
              } shadow-md transition-all duration-300 hover:shadow-lg hover:border-blue-600 text-left cursor-pointer`}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <Archive className="h-6 w-6 text-blue-300 mr-2" />
                  <span className="text-lg font-bold text-yellow-300">「賢者の箱」</span>
                </div>
                <p className="text-white text-sm mt-1">賢く選ばれし、クローゼットへ収納されるもの</p>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 border-yellow-300">
                {boxesReady[1] && <CheckCircle2 className="h-6 w-6 text-green-400" />}
              </div>
            </div>

            {/* 転送の箱 */}
            <div
              onClick={() => toggleBoxReady(2)}
              className={`w-full flex items-start space-x-4 bg-gradient-to-r from-green-900 to-green-800 p-5 rounded-lg border-2 ${
                boxesReady[2] ? "border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]" : "border-green-700"
              } shadow-md transition-all duration-300 hover:shadow-lg hover:border-green-600 text-left cursor-pointer`}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <FolderOutput className="h-6 w-6 text-green-300 mr-2" />
                  <span className="text-lg font-bold text-yellow-300">「転送の箱」</span>
                </div>
                <p className="text-white text-sm mt-1">クローゼット以外の場所へ移すもの</p>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 border-yellow-300">
                {boxesReady[2] && <CheckCircle2 className="h-6 w-6 text-green-400" />}
              </div>
            </div>

            {/* 運命の箱 */}
            <div
              onClick={() => toggleBoxReady(3)}
              className={`w-full flex items-start space-x-4 bg-gradient-to-r from-amber-900 to-amber-800 p-5 rounded-lg border-2 ${
                boxesReady[3] ? "border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]" : "border-amber-700"
              } shadow-md transition-all duration-300 hover:shadow-lg hover:border-amber-600 text-left cursor-pointer`}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 text-amber-300 mr-2" />
                  <span className="text-lg font-bold text-yellow-300">「運命の箱」</span>
                </div>
                <p className="text-white text-sm mt-1">今すぐ捨てることができない、いつかその運命をまつ者たちの箱</p>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 border-yellow-300">
                {boxesReady[3] && <CheckCircle2 className="h-6 w-6 text-green-400" />}
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleComplete}
              disabled={isCompleting || !allBoxesReady}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-purple-900 font-bold py-4 px-10 text-xl rounded-lg shadow-lg transform hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isCompleting ? "保存中..." : "準備完了！"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

