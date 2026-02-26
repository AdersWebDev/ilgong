const idBox = document.getElementById('id')
const pwBox = document.getElementById('pw');
const alertModal = document.getElementById('alert-modal');
const loader = document.getElementById("loader");
document.getElementById("pw").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        tryLogin(); // ✅ 로그인 함수 실행
    }
});
function showAlert(text) {
    // 알림창 보이게 함
    alertModal.classList.add('show');
    alertModal.innerHTML = `<p class="lg">${text}</p>`;

    // 3초 후 다시 숨김
    setTimeout(() => {
        alertModal.classList.remove('show');
    }, 3000);
}
// function isValidDate(dateString) {
//     const regex = /^\d{4}-\d{2}-\d{2}$/;
//     if (!regex.test(dateString)) {
//         return false;
//     }

//     const [year, month, day] = dateString.split("-").map(Number);
//     const date = new Date(year, month - 1, day); // JavaScript의 month는 0부터 시작

//     return !(date.getFullYear() !== year ||
//         date.getMonth() !== month - 1 ||
//         date.getDate() !== day);

// }
function tryLogin() {
    loader.style.display = "block";
    const id = idBox.value.trim();
    const pw = pwBox.value.trim();

    fetch('https://aderspro.com/auth/login', {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            "email" : id,
            "password" : pw
        })
    })
        .then(response => {
            if (!response.ok) {
                showAlert("存在しないアカウントです。")
            } else{
                window.location.href = "/aders/dashboard";
            }
        })
        .catch(error => {
            showAlert("API 요청 중 오류 발생:");
            console.error(error)
        })
        .finally(()=>{
            loader.style.display = "none";
        })

}

document.getElementById("togglePw").addEventListener("mouseenter", function () {
    document.getElementById("pw").type = "text"; // 마우스를 올리면 비밀번호 보이기
});

document.getElementById("togglePw").addEventListener("mouseleave", function () {
    document.getElementById("pw").type = "password"; // 마우스를 떼면 비밀번호 감추기
});
