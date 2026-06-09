(function(){
    const slider = document.getElementById('slider');
    const track = document.getElementById('track');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('dots');

    let slides = Array.from(track.children);
    let clonesBefore = [], clonesAfter = [];
    let currentIndex = 0;
    let slidesToShow = 3;
    let slideWidth = 0;
    let isTransitioning = false;
    let autoplayInterval = 3500;
    let autoplayTimer = null;

function determineSlidesToShow(){
    const w = window.innerWidth;
    if (w >= 1200) return 3;
    if (w >= 768) return 2;
    return 1;
}

function buildClones(){
    clonesBefore.forEach(c => c.remove());
    clonesAfter.forEach(c => c.remove());
    clonesBefore = []; clonesAfter = [];

    slides = Array.from(track.querySelectorAll('.slide')).filter(s => !s.dataset.clone);
    const N = slides.length;
    const k = Math.min(slidesToShow, N);

    for (let i = 0; i < k; i++){
    const cBefore = slides[ N - k + i ].cloneNode(true);
    cBefore.dataset.clone = 'true';
    cBefore.classList.add('clone');
    track.insertBefore(cBefore, track.firstChild);
    clonesBefore.push(cBefore);
    }
    for (let i = 0; i < k; i++){
    const cAfter = slides[i].cloneNode(true);
    cAfter.dataset.clone = 'true';
    cAfter.classList.add('clone');
    track.appendChild(cAfter);
    clonesAfter.push(cAfter);
    }
}

function resizeAndPosition(){
    slidesToShow = determineSlidesToShow();
    buildClones();

    const allSlides = Array.from(track.children);
    slideWidth = slider.clientWidth / slidesToShow;
    allSlides.forEach(s => {
    s.style.width = slideWidth + 'px';
    });

    currentIndex = Math.max(0, Math.min(currentIndex, slides.length - 1));
    const offsetIndex = clonesBefore.length + currentIndex;
    track.style.transition = 'none';
    track.style.transform = `translateX(${-offsetIndex * slideWidth}px)`;
    void track.offsetWidth;
    track.style.transition = '';
    updateActiveClasses();
    buildDots();
}

function buildDots(){
    dotsContainer.innerHTML = '';
    const n = slides.length;
    for (let i=0;i<n;i++){
    const b = document.createElement('button');
    b.ariaLabel = `Go to slide ${i+1}`;
    if (i === currentIndex) b.classList.add('active');
    b.addEventListener('click', ()=> { goTo(i); });
    dotsContainer.appendChild(b);
    }
}

function updateActiveClasses(){
    const all = Array.from(track.children);
    all.forEach(x => x.classList.remove('active'));
    const start = clonesBefore.length + currentIndex;
    for (let i = 0; i < slidesToShow; i++){
    const idx = start + i;
    if (all[idx]) all[idx].classList.add('active');
    }
    // dots active
    const dots = Array.from(dotsContainer.children);
    dots.forEach((d,i)=> d.classList.toggle('active', i === currentIndex));
}

function goTo(index, {animate=true} = {}){
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex = ((index % slides.length) + slides.length) % slides.length;
    const offsetIndex = clonesBefore.length + currentIndex;
    if (!animate) track.style.transition = 'none';
    else track.style.transition = 'transform 450ms cubic-bezier(.2,.9,.3,1)';
    track.style.transform = `translateX(${-offsetIndex * slideWidth}px)`;
    if (!animate) { void track.offsetWidth; track.style.transition = ''; }
    setTimeout(() => {
    isTransitioning = false;
    fixIfOnClone();
    updateActiveClasses();
    }, animate ? 500 : 50);
}

function next(){
    goTo(currentIndex + 1);
}
function prev(){
    goTo(currentIndex - 1);
}

function fixIfOnClone(){
    const total = Array.from(track.children).length;
    const start = clonesBefore.length;
    const end = start + slides.length - 1;
    const computedTranslate = getComputedStyle(track).transform;
    const matrix = computedTranslate === 'none' ? null : new WebKitCSSMatrix(computedTranslate);
    const tx = matrix ? matrix.m41 : 0;
    const visibleStart = Math.round(-tx / slideWidth);
    if (visibleStart < start){
    const jumpIndex = visibleStart - start + slides.length;
    track.style.transition = 'none';
    const newOffset = clonesBefore.length + jumpIndex;
    track.style.transform = `translateX(${-newOffset * slideWidth}px)`;
    currentIndex = jumpIndex;
    void track.offsetWidth;
    track.style.transition = '';
    } else if (visibleStart > end){
    const jumpIndex = visibleStart - start - slides.length;
    track.style.transition = 'none';
    const newOffset = clonesBefore.length + jumpIndex;
    track.style.transform = `translateX(${-newOffset * slideWidth}px)`;
    currentIndex = jumpIndex;
    void track.offsetWidth;
    track.style.transition = '';
    }
}

function startAutoplay(){
    stopAutoplay();
    autoplayTimer = setInterval(next, autoplayInterval);
}
function stopAutoplay(){
    if (autoplayTimer){ clearInterval(autoplayTimer); autoplayTimer = null; }
}

let pointerStart = null;
function onPointerDown(e){
    stopAutoplay();
    pointerStart = (e.touches ? e.touches[0].clientX : e.clientX);
    track.style.transition = 'none';
}
function onPointerMove(e){
    if (pointerStart === null) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = x - pointerStart;
    const offsetIndex = clonesBefore.length + currentIndex;
    track.style.transform = `translateX(${-(offsetIndex * slideWidth) + dx}px)`;
}
function onPointerUp(e){
    if (pointerStart === null) return;
    const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
    const dx = x - pointerStart;
    track.style.transition = '';
    if (Math.abs(dx) > slideWidth * 0.2){
    if (dx < 0) next(); else prev();
    } else {
    const offsetIndex = clonesBefore.length + currentIndex;
    track.style.transform = `translateX(${-offsetIndex * slideWidth}px)`;
    }
    pointerStart = null;
    startAutoplay();
}

function onKey(e){
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
}

function init(){
    slides = Array.from(track.querySelectorAll('.slide'));
    slidesToShow = determineSlidesToShow();
    buildClones();
    resizeAndPosition();

    nextBtn.addEventListener('click', ()=> { next(); startAutoplay(); });
    prevBtn.addEventListener('click', ()=> { prev(); startAutoplay(); });

    window.addEventListener('resize', ()=> {
    clearTimeout(window._sliderResizeTimer);
    window._sliderResizeTimer = setTimeout(resizeAndPosition, 120);
    });

    track.addEventListener('touchstart', onPointerDown, {passive:true});
    track.addEventListener('touchmove', onPointerMove, {passive:true});
    track.addEventListener('touchend', onPointerUp, {passive:true});
    track.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    window.addEventListener('keydown', onKey);

    track.addEventListener('transitionend', () => {
    fixIfOnClone();
    updateActiveClasses();
    });

    startAutoplay();
}

function goToDot(index){
    goTo(index);
    startAutoplay();
}

window.goToSlideFromDots = goToDot;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();

// ===============================================

function increaseCount(a, b) {
    var input = b.previousElementSibling;
    var value = parseInt(input.value, 10);
    value = isNaN(value) ? 0 : value;
    value++;
    input.value = value;
    }

function decreaseCount(a, b) {
    var input = b.nextElementSibling;
    var value = parseInt(input.value, 10);
    if (value > 1) {
    value = isNaN(value) ? 0 : value;
    value--;
    input.value = value;
    }
}

// ===================================================

function increaseCount(a, b) {
    var input = b.previousElementSibling;
    var value = parseInt(input.value, 10);
    value = isNaN(value) ? 0 : value;
    value++;
    input.value = value;
}

function decreaseCount(a, b) {
    var input = b.nextElementSibling;
    var value = parseInt(input.value, 10);
    if (value > 1) {
        value = isNaN(value) ? 0 : value;
        value--;
        input.value = value;
    }
}