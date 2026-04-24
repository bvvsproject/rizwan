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

    // Toggle Video Source
    const sourceRadios = document.querySelectorAll('input[name="vid-source"]');
    if(sourceRadios.length > 0) {
        sourceRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if(e.target.value === 'youtube') {
                    document.getElementById('vid-file-group').style.display = 'none';
                    document.getElementById('vid-file').required = false;
                    document.getElementById('vid-url-group').style.display = 'block';
                    document.getElementById('vid-youtube-url').required = true;
                } else {
                    document.getElementById('vid-file-group').style.display = 'block';
                    document.getElementById('vid-file').required = true;
                    document.getElementById('vid-url-group').style.display = 'none';
                    document.getElementById('vid-youtube-url').required = false;
                }
            });
        });
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
            const source = document.querySelector('input[name="vid-source"]:checked').value;
            const thumbFile = document.getElementById('vid-thumb').files[0];

            btn.disabled = true;
            status.style.color = "var(--text-secondary)";
            status.innerText = "Uploading thumbnail...";

            try {
                // Upload Thumbnail
                const thumbExt = thumbFile.name.split('.').pop();
                const thumbName = `${Date.now()}_thumb.${thumbExt}`;
                const { data: thumbData, error: thumbError } = await supabaseClient.storage
                    .from('thumbnails')
                    .upload(thumbName, thumbFile);
                if (thumbError) throw thumbError;
                const { data: thumbUrlData } = supabaseClient.storage.from('thumbnails').getPublicUrl(thumbName);

                // Upload Video
                let finalVideoUrl = "";
                
                if (source === 'upload') {
                    const videoFile = document.getElementById('vid-file').files[0];
                    status.innerText = "Uploading video... (this may take a while)";
                    const vidExt = videoFile.name.split('.').pop();
                    const vidName = `${Date.now()}_video.${vidExt}`;
                    const { data: vidData, error: vidError } = await supabaseClient.storage
                        .from('videos')
                        .upload(vidName, videoFile);
                    if (vidError) throw vidError;
                    const { data: vidUrlData } = supabaseClient.storage.from('videos').getPublicUrl(vidName);
                    finalVideoUrl = vidUrlData.publicUrl;
                } else {
                    finalVideoUrl = document.getElementById('vid-youtube-url').value;
                    status.innerText = "Saving to database...";
                }

                // Save to Database
                status.innerText = "Saving to database...";
                const { error: dbError } = await supabaseClient
                    .from('videos')
                    .insert([{
                        title,
                        category,
                        description,
                        video_url: finalVideoUrl,
                        thumbnail_url: thumbUrlData.publicUrl
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
