export function isMobile() {
    return (
        navigator.maxTouchPoints > 0 &&
        window.matchMedia("(pointer: coarse)").matches
    );
}
