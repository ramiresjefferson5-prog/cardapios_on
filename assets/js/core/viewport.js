function setAppHeight() {
            document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
        }
        window.addEventListener('resize', setAppHeight);
        window.addEventListener('orientationchange', setAppHeight);
        setAppHeight();
