const urlParams = new URLSearchParams(window.location.search);

const userId = urlParams.get('userId');
const displayName = urlParams.get('displayName');
const pictureUrl = urlParams.get('pictureUrl');
const statusMessage = urlParams.get('statusMessage');
const email = urlParams.get('email');

document.getElementsByClassName("displayName")[0].innerHTML = `<b>${displayName}</b>`;
document.getElementsByClassName("userId")[0].textContent = userId;
if (statusMessage === "undefined") {
    document.getElementsByClassName("statusMessage")[0].textContent = "プロフィールメッセージが設定されていません";
} else {
    document.getElementsByClassName("statusMessage")[0].textContent = statusMessage;
}
if (email === "undefined") {
    document.getElementsByClassName("email")[0].textContent = "4.13.2でメールアドレスの取得申請を行うとメールアドレスが取得できるようになります。";
} else {
    document.getElementsByClassName("email")[0].textContent = email;
}
document.getElementsByClassName("profieImg")[0].src = pictureUrl;
