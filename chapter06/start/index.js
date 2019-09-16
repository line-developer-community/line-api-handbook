const { Client, SpeechBuilder } = require("@line/clova-cek-sdk-nodejs")



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



//////////////////////////////// Logic ////////////////////////////////

/**
 * 結果メッセージ取得
 */
const getThrowResultMessage = (diceCount) => {
	const throwResult = throwDice(diceCount)
	const message = resultText(throwResult)
	return message
}

/**
 * サイコロの結果を返す
 */
const throwDice = (diceCount) => {
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
const resultText = (throwResult) => {
	if (throwResult.diceCount === 1) return `結果は ${throwResult.sum} です。`
	if (throwResult.diceCount < 4) return `結果は ${throwResult.midText} で、合計 ${throwResult.sum} です。`
	return `${throwResult.diceCount}個のサイコロの合計は ${throwResult.sum} です。`
}



//////////////////////////////// Handler ////////////////////////////////

/**
 * 起動インテント
 */
const launchHandler = async (responseHelper) => {
	responseHelper.setSimpleSpeech(SpeechBuilder.createSpeechText(LAUNCH_MESSAGE))
	responseHelper.setSimpleSpeech(SpeechBuilder.createSpeechText(LAUNCH_MESSAGE), true)
}

/**
 * サイコロを振るインテント
 */
const throwDiceHandler = async (responseHelper) => {
	// サイコロの個数をnumberスロットから取得
	const diceCount = responseHelper.getSlots().number || 1
	
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
const guideHandler = async (responseHelper) => {
	fallbackHandler(responseHelper)
}

const yesHandler = async (responseHelper) => {
	fallbackHandler(responseHelper)
}

const noHandler = async (responseHelper) => {
	fallbackHandler(responseHelper)
}

const cancelHandler = async (responseHelper) => {
	fallbackHandler(responseHelper)
}

/**
 * Fallbackインテント
 */
const fallbackHandler = async (responseHelper) => {
	responseHelper.setSimpleSpeech(SpeechBuilder.createSpeechText(FALLBACK_MESSAGE))
	responseHelper.setSimpleSpeech(SpeechBuilder.createSpeechText(FALLBACK_MESSAGE), true)
}

/**
 * 終了インテント
 */
const sessionEndedHandler = async (responseHelper) => {
	responseHelper.endSession()
}

/**
 * インテント分岐
 */
const intentHandler = async (responseHelper) => {
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

const express = require("express")
const bodyParser = require("body-parser")

const app = express()
app.listen(PORT)
app.post(ENDPOINT, bodyParser.json(), clovaSkillHandler)

console.log("start!")
