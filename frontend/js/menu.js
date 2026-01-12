
    const menuToggle = document.getElementById("menuToggle");
    const categoryMenu = document.getElementById("categoryMenu");

    menuToggle.addEventListener("click", () => {
        categoryMenu.classList.toggle("show");
    });

    // Bấm ra ngoài -> đóng menu
    document.addEventListener("click", function(e) {
        if (!categoryMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            categoryMenu.classList.remove("show");
        }
    });

