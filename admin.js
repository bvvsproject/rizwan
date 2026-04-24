// admin.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authentication Check
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    // Quick check if supabase is initialized properly
    if(!supabaseClient) {
        alert("Supabase not initialized. Check supabaseClient.js");
        return;
    }

    // 2. Login & Sign Up Handling
    const loginForm = document.getElementById('admin-login-form');
    let isSignUp = false;
    const formTitle = document.getElementById('form-title');
    const toggleSignUp = document.getElementById('toggle-signup');
    const loginBtn = document.getElementById('login-btn');

    if (toggleSignUp) {
        toggleSignUp.addEventListener('click', (e) => {
            e.preventDefault();
            isSignUp = !isSignUp;
            if (isSignUp) {
                formTitle.innerHTML = 'Create <span class="gradient-text-accent">Admin</span>';
                loginBtn.innerText = 'Create Account';
                toggleSignUp.innerText = 'Already have an account? Login';
            } else {
                formTitle.innerHTML = 'Admin <span class="gradient-text-accent">Login</span>';
                loginBtn.innerText = 'Secure Login';
                toggleSignUp.innerText = 'Create new admin account';
            }
            document.getElementById('login-error').style.display = 'none';
            document.getElementById('login-success').style.display = 'none';
        });
    }

    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorMsg = document.getElementById('login-error');
            const successMsg = document.getElementById('login-success');
            
            loginBtn.innerText = isSignUp ? 'Creating...' : 'Logging in...';
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';

            try {
                let authResponse;
                if (isSignUp) {
                    authResponse = await supabaseClient.auth.signUp({
                        email,
                        password
                    });
                } else {
                    authResponse = await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                    });
                }
                
                const { data, error } = authResponse;

                if (error) {
                    errorMsg.innerText = error.message;
                    errorMsg.style.display = 'block';
                    loginBtn.innerText = isSignUp ? 'Create Account' : 'Secure Login';
                } else {
                    if (isSignUp) {
                        successMsg.innerText = 'Admin account created successfully! Check email to confirm if required, or simply login.';
                        successMsg.style.display = 'block';
                        
                        // Switch back to login mode
                        isSignUp = false;
                        formTitle.innerHTML = 'Admin <span class="gradient-text-accent">Login</span>';
                        loginBtn.innerText = 'Secure Login';
                        toggleSignUp.innerText = 'Create new admin account';
                        loginForm.reset();
                    } else {
                        loginScreen.style.display = 'none';
                        showDashboard();
                    }
                }
            } catch (err) {
                errorMsg.innerText = "Error: " + err.message;
                errorMsg.style.display = 'block';
                loginBtn.innerText = isSignUp ? 'Create Account' : 'Secure Login';
            }
        });
    }

    // Now do the auth check (so it doesn't block event listeners from attaching if it fails)
    try {
        const session = await checkAuth();
        if (session) {
            showDashboard();
        } else {
            loginScreen.style.display = 'flex';
        }
    } catch (e) {
        console.error("Auth check failed:", e);
        loginScreen.style.display = 'flex';
    }

    // 3. Logout Handling
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.reload();
        });
    }

    // 4. Dashboard Navigation
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const views = document.querySelectorAll('.admin-view');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Hide all views
            views.forEach(v => v.style.display = 'none');
            
            // Show target view
            const targetView = link.getAttribute('data-view');
            document.getElementById(`view-${targetView}`).style.display = 'block';

            // Refresh data based on view
            if(targetView === 'overview') loadStats();
            if(targetView === 'videos') loadAdminVideos();
            if(targetView === 'services') loadAdminServices();
            if(targetView === 'enquiries') loadAdminEnquiries();
            if(targetView === 'testimonials') loadAdminTestimonials();
            if(targetView === 'offers') loadAdminOffers();
        });
    });

    // 5. Video Upload Modal Handling
    const addVideoBtn = document.getElementById('open-video-modal-btn');
    const closeAddVideoBtn = document.getElementById('close-add-video');
    const addVideoModal = document.getElementById('add-video-modal');

    if(addVideoBtn) {
        addVideoBtn.addEventListener('click', () => {
            addVideoModal.classList.add('active');
        });
    }
    if(closeAddVideoBtn) {
        closeAddVideoBtn.addEventListener('click', () => {
            addVideoModal.classList.remove('active');
        });
    }

    // Modal Toggles for Service, Testimonial, Offer
    const modals = [
        { openBtn: 'open-service-modal-btn', closeBtn: 'close-add-service', modalId: 'add-service-modal' },
        { openBtn: 'open-test-modal-btn', closeBtn: 'close-add-test', modalId: 'add-test-modal' },
        { openBtn: 'open-offer-modal-btn', closeBtn: 'close-add-offer', modalId: 'add-offer-modal' }
    ];

    modals.forEach(m => {
        const oBtn = document.getElementById(m.openBtn);
        const cBtn = document.getElementById(m.closeBtn);
        const modal = document.getElementById(m.modalId);
        
        if (oBtn && cBtn && modal) {
            oBtn.addEventListener('click', () => modal.classList.add('active'));
            cBtn.addEventListener('click', () => modal.classList.remove('active'));
        }
    });

    // Google Drive URL Converter
    function convertDriveLink(url) {
        const match = url.match(/\/d\/(.*?)\//);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
        return url;
    }

    // 6. Upload Form Submission
    const uploadForm = document.getElementById('upload-video-form');
    if(uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('upload-vid-submit-btn');
            const status = document.getElementById('upload-status');
            
            const title = document.getElementById('vid-title').value;
            const category = document.getElementById('vid-category').value;
            const description = document.getElementById('vid-desc').value;
            const rawVideoUrl = document.getElementById('vid-drive-url').value;
            const thumbUrlData = document.getElementById('vid-thumb-url').value;

            btn.disabled = true;
            status.style.color = "var(--text-secondary)";
            status.innerText = "Processing links...";

            try {
                // Convert Google Drive Link
                const finalVideoUrl = convertDriveLink(rawVideoUrl);

                // Save to Database
                status.innerText = "Saving to database...";
                const { error: dbError } = await supabaseClient
                    .from('videos')
                    .insert([{
                        title,
                        category,
                        description,
                        video_url: finalVideoUrl,
                        thumbnail_url: thumbUrlData
                    }]);
                
                if (dbError) throw dbError;

                status.style.color = "#22c55e"; // green
                status.innerText = "Upload Complete!";
                uploadForm.reset();
                setTimeout(() => {
                    addVideoModal.classList.remove('active');
                    status.innerText = "";
                    loadAdminVideos(); // Refresh list
                    loadStats();
                }, 2000);

            } catch (err) {
                console.error(err);
                status.style.color = "#ef4444"; // red
                status.innerText = `Error: ${err.message}`;
            } finally {
                btn.disabled = false;
            }
        });
    }

    // 7. Add Service Submission
    const addServiceForm = document.getElementById('add-service-form');
    if(addServiceForm) {
        addServiceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('srv-submit-btn');
            const status = document.getElementById('srv-status');
            
            btn.disabled = true;
            status.style.color = "var(--text-secondary)";
            status.innerText = "Saving service...";

            try {
                const { error } = await supabaseClient.from('services').insert([{
                    title: document.getElementById('srv-title').value,
                    description: document.getElementById('srv-desc').value,
                    icon: document.getElementById('srv-icon').value
                }]);
                
                if (error) throw error;

                status.style.color = "#22c55e";
                status.innerText = "Service Added!";
                addServiceForm.reset();
                setTimeout(() => {
                    document.getElementById('add-service-modal').classList.remove('active');
                    status.innerText = "";
                    loadAdminServices();
                    loadStats();
                }, 1500);
            } catch (err) {
                status.style.color = "#ef4444";
                status.innerText = `Error: ${err.message}`;
            } finally {
                btn.disabled = false;
            }
        });
    }

    // 8. Add Testimonial Submission
    const addTestForm = document.getElementById('add-test-form');
    if(addTestForm) {
        addTestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('test-submit-btn');
            const status = document.getElementById('test-status');
            
            btn.disabled = true;
            status.style.color = "var(--text-secondary)";
            status.innerText = "Saving testimonial...";

            try {
                const { error } = await supabaseClient.from('testimonials').insert([{
                    client_name: document.getElementById('test-name').value,
                    rating: parseInt(document.getElementById('test-rating').value),
                    review: document.getElementById('test-review').value
                }]);
                
                if (error) throw error;

                status.style.color = "#22c55e";
                status.innerText = "Testimonial Added!";
                addTestForm.reset();
                setTimeout(() => {
                    document.getElementById('add-test-modal').classList.remove('active');
                    status.innerText = "";
                    loadAdminTestimonials();
                }, 1500);
            } catch (err) {
                status.style.color = "#ef4444";
                status.innerText = `Error: ${err.message}`;
            } finally {
                btn.disabled = false;
            }
        });
    }

    // 9. Add Offer Submission
    const addOfferForm = document.getElementById('add-offer-form');
    if(addOfferForm) {
        addOfferForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('off-submit-btn');
            const status = document.getElementById('off-status-msg');
            
            btn.disabled = true;
            status.style.color = "var(--text-secondary)";
            status.innerText = "Saving offer...";

            try {
                const { error } = await supabaseClient.from('offers').insert([{
                    title: document.getElementById('off-title').value,
                    description: document.getElementById('off-desc').value,
                    image_url: document.getElementById('off-image').value,
                    status: document.getElementById('off-status').value
                }]);
                
                if (error) throw error;

                status.style.color = "#22c55e";
                status.innerText = "Offer Added!";
                addOfferForm.reset();
                setTimeout(() => {
                    document.getElementById('add-offer-modal').classList.remove('active');
                    status.innerText = "";
                    loadAdminOffers();
                }, 1500);
            } catch (err) {
                status.style.color = "#ef4444";
                status.innerText = `Error: ${err.message}`;
            } finally {
                btn.disabled = false;
            }
        });
    }

});

// Initialization
function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'flex';
    loadStats();
}

// Stats loader
async function loadStats() {
    const { count: vCount } = await supabaseClient.from('videos').select('*', { count: 'exact', head: true });
    const { count: eCount } = await supabaseClient.from('enquiries').select('*', { count: 'exact', head: true });
    const { count: sCount } = await supabaseClient.from('services').select('*', { count: 'exact', head: true });
    
    if(document.getElementById('stat-videos')) document.getElementById('stat-videos').innerText = vCount || 0;
    if(document.getElementById('stat-enquiries')) document.getElementById('stat-enquiries').innerText = eCount || 0;
    if(document.getElementById('stat-services')) document.getElementById('stat-services').innerText = sCount || 0;
}

// Videos Table Loader
async function loadAdminVideos() {
    const tbody = document.querySelector('#admin-videos-table tbody');
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    
    const { data, error } = await supabaseClient.from('videos').select('*').order('created_at', { ascending: false });
    
    if(error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No videos found</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(v => {
        tbody.innerHTML += `
            <tr>
                <td><img src="${v.thumbnail_url}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                <td>${v.title}</td>
                <td><span class="category" style="color:var(--accent-purple);">${v.category}</span></td>
                <td>${new Date(v.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; color: #ef4444; border-color: #ef4444;" onclick="deleteVideo(${v.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

// Delete logic
window.deleteVideo = async function(id) {
    if(confirm('Are you sure you want to delete this video? Note: File in storage must be deleted manually from Supabase dashboard for complete removal in this minimal setup.')) {
        const { error } = await supabaseClient.from('videos').delete().eq('id', id);
        if(error) alert('Error: ' + error.message);
        else {
            loadAdminVideos();
            loadStats();
        }
    }
}

// Services Table Loader
async function loadAdminServices() {
    const tbody = document.querySelector('#admin-services-table tbody');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    
    const { data, error } = await supabaseClient.from('services').select('*').order('created_at', { ascending: true });
    
    if(error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No services found</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td><i class='bx ${s.icon || 'bx-layer'}' style="font-size: 1.5rem; color:var(--accent-purple);"></i></td>
                <td>${s.title}</td>
                <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.description}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; color: #ef4444; border-color: #ef4444;" onclick="deleteService(${s.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.deleteService = async function(id) {
    if(confirm('Delete this service?')) {
        const { error } = await supabaseClient.from('services').delete().eq('id', id);
        if(!error) { loadAdminServices(); loadStats(); }
    }
}

// Enquiries Table Loader
async function loadAdminEnquiries() {
    const tbody = document.querySelector('#admin-enquiries-table tbody');
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    
    const { data, error } = await supabaseClient.from('enquiries').select('*').order('created_at', { ascending: false });
    
    if(error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No enquiries found</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(e => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${e.name}</strong></td>
                <td><a href="tel:${e.phone}" style="color:var(--accent-blue);">${e.phone}</a><br><a href="mailto:${e.email}" style="color:var(--text-secondary);">${e.email}</a></td>
                <td><span style="background:var(--glass-bg); padding:0.2rem 0.5rem; border-radius:4px; font-size:0.8rem;">${e.service}</span></td>
                <td style="max-width: 200px;">${e.message}</td>
                <td>${new Date(e.created_at).toLocaleDateString()}</td>
            </tr>
        `;
    });
}

// Testimonials Table Loader
async function loadAdminTestimonials() {
    const tbody = document.querySelector('#admin-testimonials-table tbody');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    
    const { data, error } = await supabaseClient.from('testimonials').select('*').order('created_at', { ascending: false });
    
    if(error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No testimonials found</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(t => {
        let stars = '';
        for(let i=0; i<t.rating; i++) stars += '★';
        tbody.innerHTML += `
            <tr>
                <td>${t.client_name}</td>
                <td style="color:#fbbf24;">${stars}</td>
                <td style="max-width: 250px;">${t.review}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; color: #ef4444; border-color: #ef4444;" onclick="deleteTestimonial(${t.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.deleteTestimonial = async function(id) {
    if(confirm('Delete this testimonial?')) {
        const { error } = await supabaseClient.from('testimonials').delete().eq('id', id);
        if(!error) loadAdminTestimonials();
    }
}

// Offers Table Loader
async function loadAdminOffers() {
    const tbody = document.querySelector('#admin-offers-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    
    const { data, error } = await supabaseClient.from('offers').select('*').order('created_at', { ascending: false });
    
    if(error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No offers found</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(o => {
        const statusColor = o.status === 'active' ? '#22c55e' : '#ef4444';
        tbody.innerHTML += `
            <tr>
                <td>${o.image_url ? `<img src="${o.image_url}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 4px;">` : 'No Image'}</td>
                <td>${o.title}</td>
                <td style="max-width: 250px;">${o.description}</td>
                <td><span style="color:${statusColor}; border: 1px solid ${statusColor}; padding: 0.2rem 0.5rem; border-radius: 4px;">${o.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; color: #ef4444; border-color: #ef4444;" onclick="deleteOffer(${o.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.deleteOffer = async function(id) {
    if(confirm('Delete this offer?')) {
        const { error } = await supabaseClient.from('offers').delete().eq('id', id);
        if(!error) loadAdminOffers();
    }
}
