function GenerateGameCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < 20; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters[randomIndex];
    }

    console.log(window.location.href);
    console.log(`${window.location.origin}/game/index.html?GameCode=${randomString}`);

    document.querySelector(".game-code").textContent = `${window.location.origin}/game/index.html?GameCode=${randomString}`
    document.querySelector(".overlay").style.display = "flex"

    document.querySelector(".join-game").addEventListener("click", function() {
        window.open(`${window.location.origin}/game/index.html?GameCode=${randomString}`, "_self")
    })
}
document.querySelector(".create-game").addEventListener("click", GenerateGameCode)