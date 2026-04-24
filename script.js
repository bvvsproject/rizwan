// script.js

// Initialize AOS Animation
document.addEventListener('DOMContentLoaded', () => {
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    });
    
    // Typing Effect
    const textToType = "Digital Marketing & AI";
    const typingElement = document.getElementById('typing-text');
    let i = 0;
    
    function typeWriter() {
        if (i < textToType.length) {
            typingElement.innerHTML += textToType.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    }
    
    setTimeout(typeWriter, 1000);

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Animated Counters
    const counters = document.querySelectorAll('.stat-number');
    const speed = 200;

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;
            const inc = target / speed;

            if (count < target) {
                counter.innerText = Math.ceil(count + inc);
                setTimeout(animateCounters, 10);
            } else {
                counter.innerText = target + (counter.parentElement.innerText.includes('%') ? '' : '+');
            }
        });
    }

    // Intersection Observer to trigger counters only when visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target);
            }
        });
    });
    
    document.querySelector('.stats-container').querySelectorAll('.stat-box').forEach(box => {
        observer.observe(box);
    });

    // Load Services, Portfolio, Testimonials, Offers from Supabase
    loadServices();
    loadPortfolio();
    loadTestimonials();
    loadOffers();

    // Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    if(contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Sending...';
            btn.disabled = true;

            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const email = document.getElementById('email').value;
            const service = document.getElementById('service').value;
            const message = document.getElementById('message').value;

            try {
                const { error } = await supabase
                    .from('enquiries')
                    .insert([{ name, phone, email, service, message }]);

                if (error) throw error;

                // Send to WhatsApp
                const waMessage = `Hi NexusAI! I'm ${name}.\nService Needed: ${service}\nMessage: ${message}`;
                const waUrl = `https://wa.me/15551234567?text=${encodeURIComponent(waMessage)}`;
                
                window.open(waUrl, '_blank');
                contactForm.reset();
                alert('Request Sent Successfully!');

            } catch (error) {
                console.error('Error submitting form:', error);
                alert('Failed to send request. Check console or try WhatsApp directly.');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    // Modal logic
    const modal = document.getElementById('video-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const videoContainer = document.getElementById('video-container');

    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        videoContainer.innerHTML = ''; // Stop video
    });

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if(e.target === modal) {
            modal.classList.remove('active');
            videoContainer.innerHTML = '';
        }
    });
});

// Load Services
async function loadServices() {
    const grid = document.getElementById('services-grid');
    const { data, error } = await supabaseClient.from('services').select('*').order('created_at', { ascending: true });
    
    if(error || !data || data.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-secondary);">No services available at the moment.</p>';
        return;
    }

    grid.innerHTML = '';
    
    data.forEach((service, index) => {
        const delay = index * 100;
        grid.innerHTML += `
            <div class="service-card" data-aos="fade-up" data-aos-delay="${delay}">
                <i class='bx ${service.icon || 'bx-layer'} service-icon'></i>
                <h3>${service.title}</h3>
                <p>${service.description}</p>
            </div>
        `;
    });
}

// Load Portfolio Videos
let allVideos = [];
async function loadPortfolio() {
    const { data, error } = await supabaseClient.from('videos').select('*').order('created_at', { ascending: false });
    const grid = document.getElementById('portfolio-grid');
    
    if(error || !data || data.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-secondary);">No videos uploaded yet.</p>';
        return;
    }
    
    allVideos = data;
    renderVideos(allVideos);

    // Setup filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // update active class
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            if(filter === 'All') {
                renderVideos(allVideos);
            } else {
                const filtered = allVideos.filter(v => v.category === filter);
                renderVideos(filtered);
            }
        });
    });
}

function renderVideos(videos) {
    const grid = document.getElementById('portfolio-grid');
    grid.innerHTML = '';

    if(videos.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-secondary);">No videos found in this category.</p>';
        return;
    }

    videos.forEach((video) => {
        grid.innerHTML += `
            <div class="video-card" onclick="openVideo('${video.video_url}')">
                <img src="${video.thumbnail_url || 'https://via.placeholder.com/600x400?text=No+Thumbnail'}" alt="${video.title}" class="video-thumb" loading="lazy">
                <div class="video-play-overlay">
                    <i class='bx bx-play' style="color:white; font-size:2rem;"></i>
                </div>
                <div class="video-info">
                    <span class="category">${video.category}</span>
                    <h4>${video.title}</h4>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">${video.description}</p>
                </div>
            </div>
        `;
    });
}

// Open Video Modal
window.openVideo = function(url) {
    const modal = document.getElementById('video-modal');
    const container = document.getElementById('video-container');
    
    // Check if YouTube, Google Drive, or direct MP4
    if(url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = url.split('v=')[1];
        if(!videoId) videoId = url.split('youtu.be/')[1];
        if(videoId) {
            const ampersandPosition = videoId.indexOf('&');
            if(ampersandPosition !== -1) videoId = videoId.substring(0, ampersandPosition);
            container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        }
    } else if (url.includes('drive.google.com')) {
        container.innerHTML = `<iframe src="${url}" frameborder="0" allow="autoplay" allowfullscreen style="width:100%; height:100%; border:none; border-radius: 12px;"></iframe>`;
    } else {
        container.innerHTML = `<video src="${url}" controls autoplay playsinline style="width:100%; height:100%; outline:none; border-radius: 12px;"></video>`;
    }
    
    modal.classList.add('active');
}

// Load Testimonials
async function loadTestimonials() {
    const wrapper = document.getElementById('testimonials-wrapper');
    const { data, error } = await supabaseClient.from('testimonials').select('*').order('created_at', { ascending: false });
    
    if(error || !data || data.length === 0) {
        wrapper.innerHTML = '<div class="swiper-slide"><p style="text-align:center; color:var(--text-secondary); width:100%;">No testimonials yet.</p></div>';
        return;
    }

    wrapper.innerHTML = '';

    data.forEach(t => {
        let starsHtml = '';
        for(let i=0; i<t.rating; i++) starsHtml += '★';
        
        wrapper.innerHTML += `
            <div class="swiper-slide">
                <div class="testimonial-card">
                    <div class="stars">${starsHtml}</div>
                    <p>"${t.review}"</p>
                    <h4 style="margin-top: 1rem;" class="gradient-text-accent">- ${t.client_name}</h4>
                </div>
            </div>
        `;
    });

    // Initialize Swiper after data loaded
    new Swiper(".mySwiper", {
        slidesPerView: 1,
        spaceBetween: 30,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            }
        }
    });
}

// Load Offers
async function loadOffers() {
    const { data, error } = await supabaseClient.from('offers').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(1);
    
    if(error || !data || data.length === 0) return;

    const offer = data[0];
    const container = document.getElementById('offers-banner-container');
    
    container.innerHTML = `
        <div class="offer-banner" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 3rem 2rem; text-align: center; margin: 0 1rem; position: relative; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);">
            ${offer.image_url ? `<img src="${offer.image_url}" style="max-width: 100%; max-height: 200px; border-radius: 8px; margin-bottom: 1.5rem; object-fit: cover;" alt="Special Offer">` : ''}
            <h2 class="gradient-text-accent" style="margin-bottom: 1rem; font-size: 2.5rem; font-weight: 700;">${offer.title}</h2>
            <p style="color: var(--text-primary); font-size: 1.2rem; max-width: 800px; margin-bottom: 2rem;">${offer.description}</p>
            <a href="#contact" class="btn btn-primary" style="padding: 1rem 3rem; font-size: 1.1rem; border-radius: 50px;">Claim Offer Now</a>
            <div class="bg-glow" style="width: 300px; height: 300px; top: -150px; right: -150px; opacity: 0.4;"></div>
            <div class="bg-glow-2" style="width: 200px; height: 200px; bottom: -100px; left: -100px; opacity: 0.3;"></div>
        </div>
    `;
    container.style.display = 'block';
}
