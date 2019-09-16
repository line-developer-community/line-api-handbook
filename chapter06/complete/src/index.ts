import { Client, Context, SpeechBuilder } from "@line/clova-cek-sdk-nodejs"



//////////////////////////////// Const ////////////////////////////////

// サーバー情報
const PORT = 3000
const ENDPOINT = `/sample-dice`

// サイコロ音mp3 URL
const DICE_SOUND_URL = `https://clova-common.line-scdn.net/dice/rolling_dice_sound.mp3`

// 固定メッセージ
const LAUNCH_MESSAGE = `いくつのサイコロを投げますか?`
const FALLBACK_MESSAGE = `ごめん、よくわかんなかった。`
const GUIDE_MESSAGE = `ひとつ、や2個、のように言ってみてください。`

type ThrowResult = { midText: string; sum: number; diceCount: number; }
// interface ThrowResult { midText: string; sum: number; diceCount: number; }

//////////////////////////////// Logic ////////////////////////////////

/**
 * 結果メッセージ取得
 */
const getThrowResultMessage = (diceCount: number) => {
	const throwResult = throwDice(diceCount)
	const message = resultText(throwResult)
	return message
}

/**
 * サイコロの結果を返す
 */
const throwDice = (diceCount: number): ThrowResult => {
	const results = []
	let midText = ""
	let sum = 0
	console.log(`throw ${diceCount} times`)
	
	for (let i = 0; i < diceCount; i++) {
		const rand = Math.floor(Math.random() * 6) + 1
		console.log(`${i + 1} time: ${rand}`)
		
		results.push(rand)
		sum += rand
		midText += `${rand}, `
	}
	
	midText = midText.replace(/, $/, "")
	return { midText, sum, diceCount }
}

/**
 * サイコロの結果を元にメッセージ分岐
 */
const resultText = (throwResult: ThrowResult) => {
	if (throwResult.diceCount === 1) return `結果は ${throwResult.sum} です。`
	if (throwResult.diceCount < 4) return `結果は ${throwResult.midText} で、合計 ${throwResult.sum} です。`
	return `${throwResult.diceCount}個のサイコロの合計は ${throwResult.sum} です。`
}



//////////////////////////////// Handler ////////////////////////////////

/**
 * 起動インテント
 */
const launchHandler = async (responseHelper: Context) => {
	responseHelper.setSimpleSpeech(SpeechBuilder.createSpeechText(LAUNCH_MESSAGE))
	responseHelper.setSimpleSpeech(SpeechBuilder.createSpeechText(LAUNCH_MESSAGE), true)
}

/**
 * サイコロを振るインテント
 */
const throwDiceHandler = async (responseHelper: Context) => {
	// サイコロの個数をnumberスロットから取得
	const diceCount = (responseHelper.getSlots().number || 1) as number
	
	// サイコロの個数分サイコロを振った結果の文言を取得
	const throwResultMessage = getThrowResultMessage(diceCount)
	
	// setSpeechListで、サイコロ個数を発話 -> サイコロを振る音再生 -> 結果を発話
	responseHelper.setSpeechList([
		SpeechBuilder.createSpeechText(`サイコロを ${diceCount}個 投げます。`),
		SpeechBuilder.createSpeechUrl(DICE_SOUND_URL),
		SpeechBuilder.createSpeechText(throwResultMessage),
	])
	
	// スキル終了
	responseHelper.endSession()
}

/**
 * ガイドインテント
 */
const guideHandler = async (responseHelper: Context) => {
	responseHelper.setSimpleSpeech(SpeechBuilder.createSpeechText(GUIDE_MESSAGE))
	responseHelper.setSimpleSpeech(SpeechBuilder.createSpeechText(GUIDE_MESSAGE), true)
}

const yesHandler = async (responseHelper: Context) => {
	fallbackHandler(responseHelper)
}

const noHandler = async (responseHelper: Context) => {
	fallbackHandler(responseHelper)
}

const cancelHandler = async (responseHelper: Context) => {
	fallbackHandler(responseHelper)
}

/**
 * Fallbackインテント
 */
const fallbackHandler = async (responseHelper: Context) => {
	responseHelper.setSimpleSpeech(SpeechBuilder.createSpeechText(FALLBACK_MESSAGE))
	responseHelper.setSimpleSpeech(SpeechBuilder.createSpeechText(FALLBACK_MESSAGE), true)
}

/**
 * 終了インテント
 */
const sessionEndedHandler = async (responseHelper: Context) => {
	responseHelper.endSession()
}

/**
 * インテント分岐
 */
const intentHandler = async (responseHelper: Context) => {
	const intentName = responseHelper.getIntentName()
	console.log(intentName)
	switch (intentName) {
		case "ThrowDiceIntent": return await throwDiceHandler(responseHelper)
		case "Clova.GuideIntent": return await guideHandler(responseHelper)
		case "Clova.YesIntent": return await yesHandler(responseHelper)
		case "Clova.NoIntent": return await noHandler(responseHelper)
		case "Clova.CancelIntent": return await cancelHandler(responseHelper)
		default: return await fallbackHandler(responseHelper)
	}
}

const clovaSkillHandler = Client
	.configureSkill()
	.onLaunchRequest(launchHandler)
	.onIntentRequest(intentHandler)
	.onSessionEndedRequest(sessionEndedHandler)
	.handle()



//////////////////////////////// App ////////////////////////////////

import express from "express"
import bodyParser from "body-parser"

const app = express()
app.listen(PORT)
app.post(ENDPOINT, bodyParser.json(), clovaSkillHandler as express.RequestHandler)

console.log("start!")
