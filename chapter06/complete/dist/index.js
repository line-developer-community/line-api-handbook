"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var clova_cek_sdk_nodejs_1 = require("@line/clova-cek-sdk-nodejs");
//////////////////////////////// Const ////////////////////////////////
// サーバー情報
var PORT = 3000;
var ENDPOINT = "/sample-dice";
// サイコロ音mp3 URL
var DICE_SOUND_URL = "https://clova-common.line-scdn.net/dice/rolling_dice_sound.mp3";
// 固定メッセージ
var LAUNCH_MESSAGE = "いくつのサイコロを投げますか?";
var FALLBACK_MESSAGE = "ごめん、よくわかんなかった。";
var GUIDE_MESSAGE = "ひとつ、や2個、のように言ってみてください。";
//////////////////////////////// Logic ////////////////////////////////
/**
 * 結果メッセージ取得
 */
var getThrowResultMessage = function (diceCount) {
    var throwResult = throwDice(diceCount);
    var message = resultText(throwResult);
    return message;
};
/**
 * サイコロの結果を返す
 */
var throwDice = function (diceCount) {
    var results = [];
    var midText = "";
    var sum = 0;
    console.log("throw " + diceCount + " times");
    for (var i = 0; i < diceCount; i++) {
        var rand = Math.floor(Math.random() * 6) + 1;
        console.log(i + 1 + " time: " + rand);
        results.push(rand);
        sum += rand;
        midText += rand + ", ";
    }
    midText = midText.replace(/, $/, "");
    return { midText: midText, sum: sum, diceCount: diceCount };
};
/**
 * サイコロの結果を元にメッセージ分岐
 */
var resultText = function (throwResult) {
    if (throwResult.diceCount === 1)
        return "\u7D50\u679C\u306F " + throwResult.sum + " \u3067\u3059\u3002";
    if (throwResult.diceCount < 4)
        return "\u7D50\u679C\u306F " + throwResult.midText + " \u3067\u3001\u5408\u8A08 " + throwResult.sum + " \u3067\u3059\u3002";
    return throwResult.diceCount + "\u500B\u306E\u30B5\u30A4\u30B3\u30ED\u306E\u5408\u8A08\u306F " + throwResult.sum + " \u3067\u3059\u3002";
};
//////////////////////////////// Handler ////////////////////////////////
/**
 * 起動インテント
 */
var launchHandler = function (responseHelper) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        responseHelper.setSimpleSpeech(clova_cek_sdk_nodejs_1.SpeechBuilder.createSpeechText(LAUNCH_MESSAGE));
        responseHelper.setSimpleSpeech(clova_cek_sdk_nodejs_1.SpeechBuilder.createSpeechText(LAUNCH_MESSAGE), true);
        return [2 /*return*/];
    });
}); };
/**
 * サイコロを振るインテント
 */
var throwDiceHandler = function (responseHelper) { return __awaiter(_this, void 0, void 0, function () {
    var diceCount, throwResultMessage;
    return __generator(this, function (_a) {
        diceCount = (responseHelper.getSlots().number || 1);
        throwResultMessage = getThrowResultMessage(diceCount);
        // setSpeechListで、サイコロ個数を発話 -> サイコロを振る音再生 -> 結果を発話
        responseHelper.setSpeechList([
            clova_cek_sdk_nodejs_1.SpeechBuilder.createSpeechText("\u30B5\u30A4\u30B3\u30ED\u3092 " + diceCount + "\u500B \u6295\u3052\u307E\u3059\u3002"),
            clova_cek_sdk_nodejs_1.SpeechBuilder.createSpeechUrl(DICE_SOUND_URL),
            clova_cek_sdk_nodejs_1.SpeechBuilder.createSpeechText(throwResultMessage),
        ]);
        // スキル終了
        responseHelper.endSession();
        return [2 /*return*/];
    });
}); };
/**
 * ガイドインテント
 */
var guideHandler = function (responseHelper) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        fallbackHandler(responseHelper);
        return [2 /*return*/];
    });
}); };
var yesHandler = function (responseHelper) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        fallbackHandler(responseHelper);
        return [2 /*return*/];
    });
}); };
var noHandler = function (responseHelper) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        fallbackHandler(responseHelper);
        return [2 /*return*/];
    });
}); };
var cancelHandler = function (responseHelper) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        fallbackHandler(responseHelper);
        return [2 /*return*/];
    });
}); };
/**
 * Fallbackインテント
 */
var fallbackHandler = function (responseHelper) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        responseHelper.setSimpleSpeech(clova_cek_sdk_nodejs_1.SpeechBuilder.createSpeechText(FALLBACK_MESSAGE));
        responseHelper.setSimpleSpeech(clova_cek_sdk_nodejs_1.SpeechBuilder.createSpeechText(FALLBACK_MESSAGE), true);
        return [2 /*return*/];
    });
}); };
/**
 * 終了インテント
 */
var sessionEndedHandler = function (responseHelper) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        responseHelper.endSession();
        return [2 /*return*/];
    });
}); };
/**
 * インテント分岐
 */
var intentHandler = function (responseHelper) { return __awaiter(_this, void 0, void 0, function () {
    var intentName, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                intentName = responseHelper.getIntentName();
                console.log(intentName);
                _a = intentName;
                switch (_a) {
                    case "ThrowDiceIntent": return [3 /*break*/, 1];
                    case "Clova.GuideIntent": return [3 /*break*/, 3];
                    case "Clova.YesIntent": return [3 /*break*/, 5];
                    case "Clova.NoIntent": return [3 /*break*/, 7];
                    case "Clova.CancelIntent": return [3 /*break*/, 9];
                }
                return [3 /*break*/, 11];
            case 1: return [4 /*yield*/, throwDiceHandler(responseHelper)];
            case 2: return [2 /*return*/, _b.sent()];
            case 3: return [4 /*yield*/, guideHandler(responseHelper)];
            case 4: return [2 /*return*/, _b.sent()];
            case 5: return [4 /*yield*/, yesHandler(responseHelper)];
            case 6: return [2 /*return*/, _b.sent()];
            case 7: return [4 /*yield*/, noHandler(responseHelper)];
            case 8: return [2 /*return*/, _b.sent()];
            case 9: return [4 /*yield*/, cancelHandler(responseHelper)];
            case 10: return [2 /*return*/, _b.sent()];
            case 11: return [4 /*yield*/, fallbackHandler(responseHelper)];
            case 12: return [2 /*return*/, _b.sent()];
        }
    });
}); };
var clovaSkillHandler = clova_cek_sdk_nodejs_1.Client
    .configureSkill()
    .onLaunchRequest(launchHandler)
    .onIntentRequest(intentHandler)
    .onSessionEndedRequest(sessionEndedHandler)
    .handle();
//////////////////////////////// App ////////////////////////////////
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var app = express_1.default();
app.listen(PORT);
app.post(ENDPOINT, body_parser_1.default.json(), clovaSkillHandler);
console.log("start!");
//# sourceMappingURL=index.js.map