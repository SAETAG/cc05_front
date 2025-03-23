"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, ArrowLeft, Home } from "lucide-react"
import { saveStageRecord } from "@/lib/playfab"

export default function Stage1BattlePage() {
  const [isMuted, setIsMuted] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [problems, setProblems] = useState("")
  const [ideals, setIdeals] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  // クライアントサイドでのみ実行されるようにする
  useEffect(() => {
    setIsClient(true)
  }, [])

  // シンプルな音声初期化 - クライアントサイドでのみ実行
  useEffect(() => {
    if (!isClient) return

    const audioElement = new Audio("/stepfight_1.mp3")
    audioElement.loop = true
    audioElement.volume = 0.7
    setAudio(audioElement)

    try {
      audioElement.play().catch((error) => {
        console.log("Auto-play was prevented:", error)
      })
    } catch (error) {
      console.log("Audio play error:", error)
    }

    return () => {
      audioElement.pause()
      audioElement.src = ""
    }
  }, [isClient])

  // ミュート状態が変更されたときに適用
  useEffect(() => {
    if (!audio) return

    audio.muted = isMuted

    // ミュート解除時に再生を試みる
    if (!isMuted && audio.paused) {
      try {
        audio.play().catch((error) => {
          console.log("Play on unmute failed:", error)
        })
      } catch (error) {
        console.log("Play error:", error)
      }
    }
  }, [isMuted, audio])

  // 画面タップで再生を試みる関数
  const tryPlayAudio = () => {
    if (!audio || !isClient) return

    if (audio.paused && !isMuted) {
      try {
        audio.play().catch((error) => {
          console.log("Play on screen tap failed:", error)
        })
      } catch (error) {
        console.log("Play error:", error)
      }
    }
  }

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Save record to database and navigate to clear page
  const saveRecord = async () => {
    setIsSaving(true)
    try {
      // 問題と理想の選択チェック
      if (!problems || !ideals) {
        alert("問題と理想のクローゼットを選択してください。")
        setIsSaving(false)
        return
      }

      // 定数マッピングで内部IDに変換
      const problemInternalId = {
        "リバウンドラゴン": "rebond_dragon",
        "忘却ゴブリン": "forgotten_goblin",
        "無限増殖スライム": "infinite_slime",
      }[problems]

      const idealInternalId = {
        "クリスタルクローゼット": "crystal_closet",
        "スタイリストクローゼット": "stylist_closet",
        "エターナルクローゼット": "eternal_closet",
      }[ideals]

      if (!problemInternalId || !idealInternalId) {
        alert("無効な選択です。もう一度選択してください。")
        setIsSaving(false)
        return
      }

      // PlayFab へデータ保存処理を呼び出す
      await saveStageRecord({
        stage1_complete: "true",
        stage1_problem: problemInternalId,
        stage1_ideal: idealInternalId,
      })

      // 保存に成功したらクリア画面へ遷移
      router.push("/closet/1/clear")
    } catch (error: any) {
      console.error("Error saving record:", error)
      let errorMessage = "保存中にエラーが発生しました。"
      
      if (error?.errorMessage?.includes("must be logged in")) {
        errorMessage = "セッションが切れました。ページを更新して再度お試しください。"
      } else if (error?.errorMessage?.includes("Invalid session ticket")) {
        errorMessage = "セッションが無効です。再度ログインしてください。"
      } else if (error?.errorMessage?.includes("Not authorized")) {
        errorMessage = "権限がありません。再度ログインしてください。"
      } else if (error?.errorMessage?.includes("API call failed")) {
        errorMessage = "サーバーとの通信に失敗しました。インターネット接続を確認してください。"
      }

      alert(errorMessage)
    } finally {
      setIsSaving(false)
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
          <Link href="/closet/1">
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
              闇の扉 - 戦闘フェーズ
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
          {/* Problems section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-yellow-300 mb-2">今のクローゼットの最も大きい不満点を選ぼう</h2>
            <p className="text-white mb-4">あなたのクローゼットの一番の悩みは何ですか？</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <button
                onClick={() => setProblems("リバウンドラゴン")}
                className={`relative overflow-hidden rounded-lg border-2 ${
                  problems === "リバウンドラゴン"
                    ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                    : "border-pink-400 hover:border-pink-300"
                } bg-gradient-to-b from-pink-900 to-pink-800 p-4 transition-all duration-300 h-52 md:h-56 flex flex-col items-center justify-between`}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-pink-500 opacity-10 rounded-lg"></div>
                <div className={`text-center ${problems === "リバウンドラゴン" ? "scale-110" : ""} transition-transform duration-300`}>
                  <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 bg-pink-800 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-300"
                      >
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                        <path d="M16 16h5v5"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-300 px-1 leading-tight">
                    片付けてもすぐにリバウンドする
                  </h3>
                  <p className="text-white text-base font-semibold mt-2 px-1">「リバウンドラゴン」</p>
                </div>
                {problems === "リバウンドラゴン" && (
                  <div className="absolute bottom-2 right-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-yellow-400"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                )}
              </button>

              <button
                onClick={() => setProblems("忘却ゴブリン")}
                className={`relative overflow-hidden rounded-lg border-2 ${
                  problems === "忘却ゴブリン"
                    ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                    : "border-cyan-400 hover:border-cyan-300"
                } bg-gradient-to-b from-cyan-800 to-sky-700 p-4 transition-all duration-300 h-52 md:h-56 flex flex-col items-center justify-between`}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-cyan-500 opacity-10 rounded-lg"></div>
                <div className={`text-center ${problems === "忘却ゴブリン" ? "scale-110" : ""} transition-transform duration-300`}>
                  <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 bg-cyan-700 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-300"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 8v4"></path>
                        <path d="M12 16h.01"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-300 px-1 leading-tight">どこに何があるかわからない</h3>
                  <p className="text-white text-base font-semibold mt-2 px-1">「忘却ゴブリン」</p>
                </div>
                {problems === "忘却ゴブリン" && (
                  <div className="absolute bottom-2 right-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-yellow-400"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                )}
              </button>

              <button
                onClick={() => setProblems("無限増殖スライム")}
                className={`relative overflow-hidden rounded-lg border-2 ${
                  problems === "無限増殖スライム"
                    ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                    : "border-orange-400 hover:border-orange-300"
                } bg-gradient-to-b from-orange-800 to-orange-900 p-4 transition-all duration-300 h-52 md:h-56 flex flex-col items-center justify-between`}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-orange-500 opacity-10 rounded-lg"></div>
                <div className={`text-center ${problems === "無限増殖スライム" ? "scale-110" : ""} transition-transform duration-300`}>
                  <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 bg-orange-800 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-300"
                      >
                        <path d="M12 3v3"></path>
                        <path d="M18 9h3"></path>
                        <path d="M21 18h-3"></path>
                        <path d="M12 21v-3"></path>
                        <path d="M3 15h3"></path>
                        <path d="M3 9h3"></path>
                        <path d="M18 12a6 6 0 0 0-6-6"></path>
                        <path d="M6 12a6 6 0 0 0 6 6"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-300 px-1 leading-tight">モノが増えすぎる</h3>
                  <p className="text-white text-base font-semibold mt-2 px-1">「無限増殖スライム」</p>
                </div>
                {problems === "無限増殖スライム" && (
                  <div className="absolute bottom-2 right-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-yellow-400"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Ideals section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-yellow-300 mb-2">理想のクローゼットに最も近いものを選ぼう</h2>
            <p className="text-white mb-4">あなたの理想のクローゼットはどのようなものですか？</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <button
                onClick={() => setIdeals("クリスタルクローゼット")}
                className={`relative overflow-hidden rounded-lg border-2 ${
                  ideals === "クリスタルクローゼット"
                    ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                    : "border-pink-400 hover:border-pink-300"
                } bg-gradient-to-b from-pink-900 to-pink-800 p-4 transition-all duration-300 h-52 md:h-56 flex flex-col items-center justify-between`}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-pink-500 opacity-10 rounded-lg"></div>
                <div className={`text-center ${ideals === "クリスタルクローゼット" ? "scale-110" : ""} transition-transform duration-300`}>
                  <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 bg-pink-800 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-300"
                      >
                        <path d="M2 12h20"></path>
                        <path d="M10 16v4"></path>
                        <path d="M14 16v4"></path>
                        <path d="M3 4h18v8H3z"></path>
                        <path d="M4 8h16"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-300 px-1 leading-tight">
                    一目でどこになにがあるのかわかる
                  </h3>
                  <p className="text-white text-base font-semibold mt-2 px-1">「クリスタルクローゼット」</p>
                </div>
                {ideals === "クリスタルクローゼット" && (
                  <div className="absolute bottom-2 right-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-yellow-400"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                )}
              </button>

              <button
                onClick={() => setIdeals("スタイリストクローゼット")}
                className={`relative overflow-hidden rounded-lg border-2 ${
                  ideals === "スタイリストクローゼット"
                    ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                    : "border-cyan-400 hover:border-cyan-300"
                } bg-gradient-to-b from-cyan-800 to-sky-700 p-4 transition-all duration-300 h-52 md:h-56 flex flex-col items-center justify-between`}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-cyan-500 opacity-10 rounded-lg"></div>
                <div className={`text-center ${ideals === "スタイリストクローゼット" ? "scale-110" : ""} transition-transform duration-300`}>
                  <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 bg-cyan-700 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-300"
                      >
                        <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1"></path>
                        <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1"></path>
                        <path d="M12 12v9"></path>
                        <path d="M8 21h8"></path>
                        <path d="M4 8h16"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-300 px-1 leading-tight">すぐにコーディネートが決まる</h3>
                  <p className="text-white text-base font-semibold mt-2 px-1">「スタイリストクローゼット」</p>
                </div>
                {ideals === "スタイリストクローゼット" && (
                  <div className="absolute bottom-2 right-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-yellow-400"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                )}
              </button>

              <button
                onClick={() => setIdeals("エターナルクローゼット")}
                className={`relative overflow-hidden rounded-lg border-2 ${
                  ideals === "エターナルクローゼット"
                    ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                    : "border-orange-400 hover:border-orange-300"
                } bg-gradient-to-b from-orange-800 to-orange-900 p-4 transition-all duration-300 h-52 md:h-56 flex flex-col items-center justify-between`}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-orange-500 opacity-10 rounded-lg"></div>
                <div className={`text-center ${ideals === "エターナルクローゼット" ? "scale-110" : ""} transition-transform duration-300`}>
                  <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 bg-orange-800 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-300"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-300 px-1 leading-tight">永遠に綺麗な状態を保つ</h3>
                  <p className="text-white text-base font-semibold mt-2 px-1">「エターナルクローゼット」</p>
                </div>
                {ideals === "エターナルクローゼット" && (
                  <div className="absolute bottom-2 right-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-yellow-400"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-center mt-8">
            <Button
              onClick={saveRecord}
              disabled={isSaving || !problems || !ideals}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-purple-900 font-bold py-3 px-8 text-lg rounded-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              {isSaving ? "保存中..." : "記録する"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
