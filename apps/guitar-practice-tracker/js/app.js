// Global state to store our data
const state = {
    sessions: [],
    techniques: [],
    songs: [],
    settings: {
        levelUpMinutes: 60,
        songCompletionMinutes: 120,
        streakThreshold: 1,
        goalMinutesPerWeek: 210
    },
    formData: {
        date: new Date().toISOString().split('T')[0],
        duration: 30,
        techniques: [],
        songs: [],
        notes: ''
    },
    activeTab: 'log',
    newTechnique: '',
    newSong: '',
    sessionToDelete: null
};

// Load data from localStorage
function loadFromLocalStorage() {
    try {
        const savedSessions = localStorage.getItem('practiceSessions');
        if (savedSessions) {
            state.sessions = JSON.parse(savedSessions);
        }
        
        const savedTechniques = localStorage.getItem('techniques');
        if (savedTechniques) {
            state.techniques = JSON.parse(savedTechniques);
        } else {
            state.techniques = [
                { id: 1, name: 'Scales', level: 0 },
                { id: 2, name: 'Chords', level: 0 },
                { id: 3, name: 'Fingerpicking', level: 0 },
                { id: 4, name: 'Bends', level: 0 },
                { id: 5, name: 'Vibrato', level: 0 }
            ];
        }
        
        const savedSongs = localStorage.getItem('songs');
        if (savedSongs) {
            state.songs = JSON.parse(savedSongs);
        } else {
            state.songs = [
                { id: 1, name: 'Example Song 1', progress: 0 },
                { id: 2, name: 'Example Song 2', progress: 0 }
            ];
        }
        
        const savedSettings = localStorage.getItem('settings');
        if (savedSettings) {
            state.settings = JSON.parse(savedSettings);
        }
    } catch (e) {
        console.error("Error loading data from localStorage", e);
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('practiceSessions', JSON.stringify(state.sessions));
        localStorage.setItem('techniques', JSON.stringify(state.techniques));
        localStorage.setItem('songs', JSON.stringify(state.songs));
        localStorage.setItem('settings', JSON.stringify(state.settings));
    } catch (e) {
        console.error("Error saving data to localStorage", e);
    }
}

// Calculate statistics
function calculateTotalPracticeTime() {
    return state.sessions.reduce((total, session) => 
        total + Number(session.duration), 0);
}

function getLast7DaysSessions() {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    return state.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= sevenDaysAgo;
    });
}

// Calculate streak
function calculateStreak() {
    if (state.sessions.length === 0) return 0;
    
    // Group sessions by date and sum durations
    const sessionsByDate = {};
    state.sessions.forEach(session => {
        const date = new Date(session.date).toISOString().split('T')[0];
        sessionsByDate[date] = (sessionsByDate[date] || 0) + Number(session.duration);
    });
    
    // Get valid dates meeting threshold
    const validDates = Object.entries(sessionsByDate)
        .filter(([_, duration]) => duration >= state.settings.streakThreshold)
        .map(([date]) => date)
        .sort()
        .reverse();
        
    if (validDates.length === 0) return 0;
    
    // Check if practiced today or yesterday
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (validDates[0] !== today && validDates[0] !== yesterdayStr) {
        return 0; // Streak broken
    }
    
    // Count consecutive days
    let streak = 1;
    for (let i = 0; i < validDates.length - 1; i++) {
        const current = new Date(validDates[i]);
        const next = new Date(validDates[i + 1]);
        
        const diffDays = Math.ceil(
            Math.abs(current - next) / (1000 * 60 * 60 * 24)
        );
        
        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// Calculate weekly progress
function getWeeklyProgress() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const thisWeekSessions = state.sessions.filter(session => 
        new Date(session.date) >= startOfWeek
    );
    
    const thisWeekMinutes = thisWeekSessions.reduce(
        (total, session) => total + Number(session.duration), 0
    );
    
    const goalPercentage = Math.min(
        (thisWeekMinutes / state.settings.goalMinutesPerWeek) * 100, 
        100
    );
    
    return {
        minutes: thisWeekMinutes,
        percentage: goalPercentage
    };
}

// Update UI based on current state
function render() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = ''; // Clear previous content
    
    // Add header
    const header = document.createElement('header');
    header.className = 'bg-indigo-600 text-white p-4 shadow-md';
    header.innerHTML = `
        <div class="flex items-center max-w-6xl mx-auto">
            <div class="mr-4 flex-shrink-0" style="width: 60px; height: 60px;">
                <svg viewBox="0 0 300 500" width="60" height="60" preserveAspectRatio="xMidYMid meet">
                    <!-- Guitar SVG code -->
                    <path 
                        d="M100,300 C60,350 60,450 100,500 C150,550 200,550 250,500 C290,450 290,350 250,300 C200,250 150,250 100,300 Z" 
                        fill="#e74c3c" 
                        stroke="#7d3129" 
                        stroke-width="4"
                    />
                    <rect x="160" y="50" width="30" height="250" fill="#8b4513" stroke="#5d2906" stroke-width="2" />
                    <rect x="160" y="90" width="30" height="5" fill="#d3d3d3" />
                    <rect x="160" y="130" width="30" height="5" fill="#d3d3d3" />
                    <rect x="160" y="170" width="30" height="5" fill="#d3d3d3" />
                    <rect x="160" y="210" width="30" height="5" fill="#d3d3d3" />
                    <rect x="160" y="250" width="30" height="5" fill="#d3d3d3" />
                    <path d="M150,10 L200,10 L200,50 L150,50 Z" fill="#8b4513" stroke="#5d2906" stroke-width="2" />
                    <circle cx="160" cy="20" r="5" fill="#333" />
                    <circle cx="160" cy="40" r="5" fill="#333" />
                    <circle cx="190" cy="20" r="5" fill="#333" />
                    <circle cx="190" cy="40" r="5" fill="#333" />
                    <circle cx="175" cy="375" r="40" fill="#222" />
                    <circle cx="175" cy="375" r="37" fill="none" stroke="#f0d3a7" stroke-width="3" />
                    <circle cx="175" cy="375" r="30" fill="none" stroke="#8b4513" stroke-width="1.5" />
                    <rect x="150" y="450" width="50" height="10" fill="#5d2906" />
                    <path d="M120,425 C140,435 210,435 230,425" fill="none" stroke="#7d3129" stroke-width="3" />
                    <path d="M110,445 C140,460 210,460 240,445" fill="none" stroke="#7d3129" stroke-width="3" />
                    <line x1="175" y1="50" x2="175" y2="450" stroke="#d3d3d3" stroke-width="1.5" />
                    <line x1="165" y1="50" x2="165" y2="450" stroke="#d3d3d3" stroke-width="1.5" />
                    <line x1="185" y1="50" x2="185" y2="450" stroke="#d3d3d3" stroke-width="1.5" />
                </svg>
            </div>
            <h1 class="text-2xl font-bold">Guitar Practice Tracker</h1>
        </div>
    `;
    appContainer.appendChild(header);
    
    // Add navigation
    const nav = document.createElement('nav');
    nav.className = 'bg-indigo-700 text-white shadow-md';
    nav.innerHTML = `
        <div class="flex flex-wrap max-w-6xl mx-auto">
            <button 
                id="tab-log"
                class="flex items-center px-4 py-3 sm:px-6 hover:bg-indigo-600 transition duration-150 ${state.activeTab === 'log' ? 'bg-indigo-800' : ''}"
            >
                <i data-lucide="calendar" class="mr-2 h-5 w-5"></i>
                Log Practice
            </button>
            <button 
                id="tab-techniques"
                class="flex items-center px-4 py-3 sm:px-6 hover:bg-indigo-600 transition duration-150 ${state.activeTab === 'techniques' ? 'bg-indigo-800' : ''}"
            >
                <i data-lucide="music" class="mr-2 h-5 w-5"></i>
                Techniques
            </button>
            <button 
                id="tab-songs"
                class="flex items-center px-4 py-3 sm:px-6 hover:bg-indigo-600 transition duration-150 ${state.activeTab === 'songs' ? 'bg-indigo-800' : ''}"
            >
                <i data-lucide="list-checks" class="mr-2 h-5 w-5"></i>
                Songs
            </button>
            <button 
                id="tab-stats"
                class="flex items-center px-4 py-3 sm:px-6 hover:bg-indigo-600 transition duration-150 ${state.activeTab === 'stats' ? 'bg-indigo-800' : ''}"
            >
                <i data-lucide="bar-chart-2" class="mr-2 h-5 w-5"></i>
                Stats
            </button>
            <button 
                id="tab-settings"
                class="flex items-center px-4 py-3 sm:px-6 hover:bg-indigo-600 transition duration-150 ${state.activeTab === 'settings' ? 'bg-indigo-800' : ''}"
            >
                <i data-lucide="settings" class="mr-2 h-5 w-5"></i>
                Settings
            </button>
        </div>
    `;
    appContainer.appendChild(nav);
    
    // Create main content div
    const mainContent = document.createElement('div');
    mainContent.className = 'flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto';
    
    // Stats summary
    const statsSummary = document.createElement('div');
    statsSummary.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto';
    statsSummary.innerHTML = `
        <div class="bg-white rounded-lg shadow p-4 flex items-center">
            <i data-lucide="clock" class="h-10 w-10 text-indigo-500 mr-4"></i>
            <div>
                <p class="text-gray-500">Total Practice Time</p>
                <p class="text-2xl font-bold">${calculateTotalPracticeTime()} minutes</p>
            </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-4 flex items-center">
            <i data-lucide="calendar" class="h-10 w-10 text-indigo-500 mr-4"></i>
            <div>
                <p class="text-gray-500">Sessions This Week</p>
                <p class="text-2xl font-bold">${getLast7DaysSessions().length}</p>
            </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-4 flex items-center">
            <i data-lucide="award" class="h-10 w-10 text-indigo-500 mr-4"></i>
            <div>
                <p class="text-gray-500">Current Streak</p>
                <p class="text-2xl font-bold">${calculateStreak()} days</p>
            </div>
        </div>
    `;
    mainContent.appendChild(statsSummary);
    
    // Tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'bg-white rounded-lg shadow p-6 max-w-6xl mx-auto mt-6';
    
    // Render different content based on active tab
    switch(state.activeTab) {
        case 'log':
            renderLogTab(tabContent);
            break;
        case 'techniques':
            renderTechniquesTab(tabContent);
            break;
        case 'songs':
            renderSongsTab(tabContent);
            break;
        case 'stats':
            renderStatsTab(tabContent);
            break;
        case 'settings':
            renderSettingsTab(tabContent);
            break;
    }
    
    mainContent.appendChild(tabContent);
    appContainer.appendChild(mainContent);
    
    // Render delete confirmation modal if needed
    if (state.sessionToDelete) {
        renderDeleteModal();
    }
    
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Add event listeners
    addEventListeners();
}

function renderLogTab(container) {
    container.innerHTML = `
        <h2 class="text-xl font-bold mb-6">Log Practice Session</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label class="block text-gray-700 mb-2">Date</label>
                <input
                    type="date"
                    id="practice-date"
                    value="${state.formData.date}"
                    class="w-full border border-gray-300 rounded py-2 px-3"
                />
            </div>
            
            <div>
                <label class="block text-gray-700 mb-2">Duration (minutes)</label>
                <input
                    type="number"
                    id="practice-duration"
                    value="${state.formData.duration}"
                    class="w-full border border-gray-300 rounded py-2 px-3"
                    min="1"
                />
            </div>
        </div>
        
        <div class="mb-6">
            <label class="block text-gray-700 mb-2">Techniques Practiced</label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                ${state.techniques.map(tech => `
                    <div class="flex items-center">
                        <input
                            type="checkbox"
                            id="tech-${tech.id}"
                            ${state.formData.techniques.includes(tech.id) ? 'checked' : ''}
                            class="mr-2 tech-checkbox"
                            data-tech-id="${tech.id}"
                        />
                        <label for="tech-${tech.id}">${tech.name}</label>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="mb-6">
            <label class="block text-gray-700 mb-2">Songs Practiced</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                ${state.songs.map(song => `
                    <div class="flex items-center">
                        <input
                            type="checkbox"
                            id="song-${song.id}"
                            ${state.formData.songs.includes(song.id) ? 'checked' : ''}
                            class="mr-2 song-checkbox"
                            data-song-id="${song.id}"
                        />
                        <label for="song-${song.id}">${song.name}</label>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="mb-6">
            <label class="block text-gray-700 mb-2">Notes</label>
            <textarea
                id="practice-notes"
                class="w-full border border-gray-300 rounded py-2 px-3"
                rows="3"
            >${state.formData.notes}</textarea>
        </div>
        
        <button 
            id="save-practice-btn"
            class="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-150"
        >
            Save Practice Session
        </button>
    `;
    
    // Add recent sessions if available
    if (state.sessions.length > 0) {
        const recentSessionsDiv = document.createElement('div');
        recentSessionsDiv.className = 'mt-10';
        recentSessionsDiv.innerHTML = `
            <h3 class="text-lg font-bold mb-4">Recent Sessions</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th class="py-2 px-4 border-b text-left font-medium">Date</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Duration</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Techniques</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Songs</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${[...state.sessions].reverse().slice(0, 5).map(session => `
                            <tr>
                                <td class="py-2 px-4 border-b">${session.date}</td>
                                <td class="py-2 px-4 border-b">${session.duration} minutes</td>
                                <td class="py-2 px-4 border-b">
                                    ${session.techniques.map(techId => {
                                        const tech = state.techniques.find(t => t.id === techId);
                                        return tech ? tech.name : '';
                                    }).join(', ')}
                                </td>
                                <td class="py-2 px-4 border-b">
                                    ${session.songs.map(songId => {
                                        const song = state.songs.find(s => s.id === songId);
                                        return song ? song.name : '';
                                    }).join(', ')}
                                </td>
                                <td class="py-2 px-4 border-b">
                                    <button 
                                        class="text-red-600 hover:text-red-800 delete-session-btn"
                                        data-session-id="${session.id}"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.appendChild(recentSessionsDiv);
    }
}

function renderTechniquesTab(container) {
    container.innerHTML = `
        <h2 class="text-xl font-bold mb-6">Techniques</h2>
        
        <div class="mb-6 flex">
            <input
                type="text"
                id="new-technique-input"
                value="${state.newTechnique}"
                class="flex-1 border border-gray-300 rounded-l py-2 px-3"
                placeholder="Add new technique..."
            />
            <button 
                id="add-technique-btn"
                class="bg-indigo-600 text-white py-2 px-4 rounded-r hover:bg-indigo-700 transition duration-150"
            >
                Add
            </button>
        </div>
        
        <div class="grid grid-cols-1 gap-4">
            ${state.techniques.map(tech => `
                <div class="border rounded p-4">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold">${tech.name}</h3>
                        <span class="text-gray-500">Level: ${tech.level.toFixed(1)}/10</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded h-2">
                        <div 
                            class="bg-indigo-600 h-2 rounded" 
                            style="width: ${(tech.level / 10) * 100}%"
                        ></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderSongsTab(container) {
    container.innerHTML = `
        <h2 class="text-xl font-bold mb-6">Songs</h2>
        
        <div class="mb-6 flex">
            <input
                type="text"
                id="new-song-input"
                value="${state.newSong}"
                class="flex-1 border border-gray-300 rounded-l py-2 px-3"
                placeholder="Add new song..."
            />
            <button 
                id="add-song-btn"
                class="bg-indigo-600 text-white py-2 px-4 rounded-r hover:bg-indigo-700 transition duration-150"
            >
                Add
            </button>
        </div>
        
        <div class="grid grid-cols-1 gap-4">
            ${state.songs.map(song => `
                <div class="border rounded p-4">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold">${song.name}</h3>
                        <span class="text-gray-500">${song.progress.toFixed(1)}% Complete</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded h-2">
                        <div 
                            class="bg-indigo-600 h-2 rounded" 
                            style="width: ${song.progress}%"
                        ></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderStatsTab(container) {
    if (state.sessions.length === 0) {
        container.innerHTML = `
            <h2 class="text-xl font-bold mb-6">Practice Statistics</h2>
            <p>No practice data available yet. Start logging your practice sessions!</p>
        `;
        return;
    }
    
    const weeklyProgress = getWeeklyProgress();
    
    container.innerHTML = `
        <h2 class="text-xl font-bold mb-6">Practice Statistics</h2>
        
        <div class="mb-8">
            <h3 class="text-lg font-bold mb-4">Practice by Technique</h3>
            <div class="space-y-4">
                ${state.techniques.map(tech => {
                    const sessionsWithTech = state.sessions.filter(s => 
                        s.techniques.includes(tech.id)
                    ).length;
                    
                    const percentage = state.sessions.length > 0 
                        ? (sessionsWithTech / state.sessions.length) * 100 
                        : 0;
                    
                    return `
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <span>${tech.name}</span>
                                <span>${sessionsWithTech} sessions</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded h-4">
                                <div 
                                    class="bg-indigo-600 h-4 rounded" 
                                    style="width: ${percentage}%"
                                ></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="mb-8">
            <h3 class="text-lg font-bold mb-4">Weekly Goal Progress</h3>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="flex justify-between mb-2">
                    <span>Weekly Goal: ${state.settings.goalMinutesPerWeek} minutes</span>
                    <span>${weeklyProgress.minutes} / ${state.settings.goalMinutesPerWeek} minutes</span>
                </div>
                <div class="w-full bg-gray-200 rounded h-6">
                    <div 
                        class="bg-green-500 h-6 rounded" 
                        style="width: ${weeklyProgress.percentage}%"
                    ></div>
                </div>
            </div>
        </div>
        
        <div>
            <h3 class="text-lg font-bold mb-4">All Practice Sessions</h3>
            <div class="overflow-x-auto border rounded">
                <table class="min-w-full bg-white">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="py-2 px-4 border-b text-left font-medium">Date</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Duration</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${[...state.sessions]
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map(session => `
                                <tr>
                                    <td class="py-2 px-4 border-b">${session.date}</td>
                                    <td class="py-2 px-4 border-b">${session.duration} minutes</td>
                                    <td class="py-2 px-4 border-b">
                                        <button 
                                            class="text-red-600 hover:text-red-800 delete-session-btn"
                                            data-session-id="${session.id}"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderSettingsTab(container) {
    container.innerHTML = `
        <h2 class="text-xl font-bold mb-6">Practice Settings</h2>
        
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-semibold mb-3">Progress Requirements</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-700 mb-2">
                            Minutes to Level Up a Technique
                        </label>
                        <div class="flex items-center">
                            <input
                                type="number"
                                id="level-up-minutes"
                                value="${state.settings.levelUpMinutes}"
                                class="w-full border border-gray-300 rounded py-2 px-3"
                                min="1"
                            />
                            <span class="ml-2">minutes</span>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">
                            Time required to advance a technique by 1 level (max 10)
                        </p>
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 mb-2">
                            Minutes to Complete a Song
                        </label>
                        <div class="flex items-center">
                            <input
                                type="number"
                                id="song-completion-minutes"
                                value="${state.settings.songCompletionMinutes}"
                                class="w-full border border-gray-300 rounded py-2 px-3"
                                min="1"
                            />
                            <span class="ml-2">minutes</span>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">
                            Time required to reach 100% completion on a song
                        </p>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 class="text-lg font-semibold mb-3">Goals & Streaks</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-700 mb-2">
                            Weekly Practice Goal
                        </label>
                        <div class="flex items-center">
                            <input
                                type="number"
                                id="goal-
                                // Global state to store our data
const state = {
    sessions: [],
    techniques: [],
    songs: [],
    settings: {
        levelUpMinutes: 60,
        songCompletionMinutes: 120,
        streakThreshold: 1,
        goalMinutesPerWeek: 210
    },
    formData: {
        date: new Date().toISOString().split('T')[0],
        duration: 30,
        techniques: [],
        songs: [],
        notes: ''
    },
    activeTab: 'log',
    newTechnique: '',
    newSong: '',
    sessionToDelete: null
};

// Load data from localStorage
function loadFromLocalStorage() {
    try {
        const savedSessions = localStorage.getItem('practiceSessions');
        if (savedSessions) {
            state.sessions = JSON.parse(savedSessions);
        }
        
        const savedTechniques = localStorage.getItem('techniques');
        if (savedTechniques) {
            state.techniques = JSON.parse(savedTechniques);
        } else {
            state.techniques = [
                { id: 1, name: 'Scales', level: 0 },
                { id: 2, name: 'Chords', level: 0 },
                { id: 3, name: 'Fingerpicking', level: 0 },
                { id: 4, name: 'Bends', level: 0 },
                { id: 5, name: 'Vibrato', level: 0 }
            ];
        }
        
        const savedSongs = localStorage.getItem('songs');
        if (savedSongs) {
            state.songs = JSON.parse(savedSongs);
        } else {
            state.songs = [
                { id: 1, name: 'Example Song 1', progress: 0 },
                { id: 2, name: 'Example Song 2', progress: 0 }
            ];
        }
        
        const savedSettings = localStorage.getItem('settings');
        if (savedSettings) {
            state.settings = JSON.parse(savedSettings);
        }
    } catch (e) {
        console.error("Error loading data from localStorage", e);
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('practiceSessions', JSON.stringify(state.sessions));
        localStorage.setItem('techniques', JSON.stringify(state.techniques));
        localStorage.setItem('songs', JSON.stringify(state.songs));
        localStorage.setItem('settings', JSON.stringify(state.settings));
    } catch (e) {
        console.error("Error saving data to localStorage", e);
    }
}

// Calculate statistics
function calculateTotalPracticeTime() {
    return state.sessions.reduce((total, session) => 
        total + Number(session.duration), 0);
}

function getLast7DaysSessions() {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    return state.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= sevenDaysAgo;
    });
}

// Calculate streak
function calculateStreak() {
    if (state.sessions.length === 0) return 0;
    
    // Group sessions by date and sum durations
    const sessionsByDate = {};
    state.sessions.forEach(session => {
        const date = new Date(session.date).toISOString().split('T')[0];
        sessionsByDate[date] = (sessionsByDate[date] || 0) + Number(session.duration);
    });
    
    // Get valid dates meeting threshold
    const validDates = Object.entries(sessionsByDate)
        .filter(([_, duration]) => duration >= state.settings.streakThreshold)
        .map(([date]) => date)
        .sort()
        .reverse();
        
    if (validDates.length === 0) return 0;
    
    // Check if practiced today or yesterday
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (validDates[0] !== today && validDates[0] !== yesterdayStr) {
        return 0; // Streak broken
    }
    
    // Count consecutive days
    let streak = 1;
    for (let i = 0; i < validDates.length - 1; i++) {
        const current = new Date(validDates[i]);
        const next = new Date(validDates[i + 1]);
        
        const diffDays = Math.ceil(
            Math.abs(current - next) / (1000 * 60 * 60 * 24)
        );
        
        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// Calculate weekly progress
function getWeeklyProgress() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const thisWeekSessions = state.sessions.filter(session => 
        new Date(session.date) >= startOfWeek
    );
    
    const thisWeekMinutes = thisWeekSessions.reduce(
        (total, session) => total + Number(session.duration), 0
    );
    
    const goalPercentage = Math.min(
        (thisWeekMinutes / state.settings.goalMinutesPerWeek) * 100, 
        100
    );
    
    return {
        minutes: thisWeekMinutes,
        percentage: goalPercentage
    };
}

// Update UI based on current state
function render() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = ''; // Clear previous content
    
    // Add header
    const header = document.createElement('header');
    header.className = 'bg-indigo-600 text-white p-4 shadow-md';
    header.innerHTML = `
        <div class="flex items-center max-w-6xl mx-auto">
            <div class="mr-4 flex-shrink-0" style="width: 60px; height: 60px;">
                <svg viewBox="0 0 300 500" width="60" height="60" preserveAspectRatio="xMidYMid meet">
                    <!-- Guitar SVG code -->
                    <path 
                        d="M100,300 C60,350 60,450 100,500 C150,550 200,550 250,500 C290,450 290,350 250,300 C200,250 150,250 100,300 Z" 
                        fill="#e74c3c" 
                        stroke="#7d3129" 
                        stroke-width="4"
                    />
                    <rect x="160" y="50" width="30" height="250" fill="#8b4513" stroke="#5d2906" stroke-width="2" />
                    <rect x="160" y="90" width="30" height="5" fill="#d3d3d3" />
                    <rect x="160" y="130" width="30" height="5" fill="#d3d3d3" />
                    <rect x="160" y="170" width="30" height="5" fill="#d3d3d3" />
                    <rect x="160" y="210" width="30" height="5" fill="#d3d3d3" />
                    <rect x="160" y="250" width="30" height="5" fill="#d3d3d3" />
                    <path d="M150,10 L200,10 L200,50 L150,50 Z" fill="#8b4513" stroke="#5d2906" stroke-width="2" />
                    <circle cx="160" cy="20" r="5" fill="#333" />
                    <circle cx="160" cy="40" r="5" fill="#333" />
                    <circle cx="190" cy="20" r="5" fill="#333" />
                    <circle cx="190" cy="40" r="5" fill="#333" />
                    <circle cx="175" cy="375" r="40" fill="#222" />
                    <circle cx="175" cy="375" r="37" fill="none" stroke="#f0d3a7" stroke-width="3" />
                    <circle cx="175" cy="375" r="30" fill="none" stroke="#8b4513" stroke-width="1.5" />
                    <rect x="150" y="450" width="50" height="10" fill="#5d2906" />
                    <path d="M120,425 C140,435 210,435 230,425" fill="none" stroke="#7d3129" stroke-width="3" />
                    <path d="M110,445 C140,460 210,460 240,445" fill="none" stroke="#7d3129" stroke-width="3" />
                    <line x1="175" y1="50" x2="175" y2="450" stroke="#d3d3d3" stroke-width="1.5" />
                    <line x1="165" y1="50" x2="165" y2="450" stroke="#d3d3d3" stroke-width="1.5" />
                    <line x1="185" y1="50" x2="185" y2="450" stroke="#d3d3d3" stroke-width="1.5" />
                </svg>
            </div>
            <h1 class="text-2xl font-bold">Guitar Practice Tracker</h1>
        </div>
    `;
    appContainer.appendChild(header);
    
    // Add navigation
    const nav = document.createElement('nav');
    nav.className = 'bg-indigo-700 text-white shadow-md';
    nav.innerHTML = `
        <div class="flex flex-wrap max-w-6xl mx-auto">
            <button 
                id="tab-log"
                class="flex items-center px-4 py-3 sm:px-6 hover:bg-indigo-600 transition duration-150 ${state.activeTab === 'log' ? 'bg-indigo-800' : ''}"
            >
                <i data-lucide="calendar" class="mr-2 h-5 w-5"></i>
                Log Practice
            </button>
            <button 
                id="tab-techniques"
                class="flex items-center px-4 py-3 sm:px-6 hover:bg-indigo-600 transition duration-150 ${state.activeTab === 'techniques' ? 'bg-indigo-800' : ''}"
            >
                <i data-lucide="music" class="mr-2 h-5 w-5"></i>
                Techniques
            </button>
            <button 
                id="tab-songs"
                class="flex items-center px-4 py-3 sm:px-6 hover:bg-indigo-600 transition duration-150 ${state.activeTab === 'songs' ? 'bg-indigo-800' : ''}"
            >
                <i data-lucide="list-checks" class="mr-2 h-5 w-5"></i>
                Songs
            </button>
            <button 
                id="tab-stats"
                class="flex items-center px-4 py-3 sm:px-6 hover:bg-indigo-600 transition duration-150 ${state.activeTab === 'stats' ? 'bg-indigo-800' : ''}"
            >
                <i data-lucide="bar-chart-2" class="mr-2 h-5 w-5"></i>
                Stats
            </button>
            <button 
                id="tab-settings"
                class="flex items-center px-4 py-3 sm:px-6 hover:bg-indigo-600 transition duration-150 ${state.activeTab === 'settings' ? 'bg-indigo-800' : ''}"
            >
                <i data-lucide="settings" class="mr-2 h-5 w-5"></i>
                Settings
            </button>
        </div>
    `;
    appContainer.appendChild(nav);
    
    // Create main content div
    const mainContent = document.createElement('div');
    mainContent.className = 'flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto';
    
    // Stats summary
    const statsSummary = document.createElement('div');
    statsSummary.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto';
    statsSummary.innerHTML = `
        <div class="bg-white rounded-lg shadow p-4 flex items-center">
            <i data-lucide="clock" class="h-10 w-10 text-indigo-500 mr-4"></i>
            <div>
                <p class="text-gray-500">Total Practice Time</p>
                <p class="text-2xl font-bold">${calculateTotalPracticeTime()} minutes</p>
            </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-4 flex items-center">
            <i data-lucide="calendar" class="h-10 w-10 text-indigo-500 mr-4"></i>
            <div>
                <p class="text-gray-500">Sessions This Week</p>
                <p class="text-2xl font-bold">${getLast7DaysSessions().length}</p>
            </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-4 flex items-center">
            <i data-lucide="award" class="h-10 w-10 text-indigo-500 mr-4"></i>
            <div>
                <p class="text-gray-500">Current Streak</p>
                <p class="text-2xl font-bold">${calculateStreak()} days</p>
            </div>
        </div>
    `;
    mainContent.appendChild(statsSummary);
    
    // Tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'bg-white rounded-lg shadow p-6 max-w-6xl mx-auto mt-6';
    
    // Render different content based on active tab
    switch(state.activeTab) {
        case 'log':
            renderLogTab(tabContent);
            break;
        case 'techniques':
            renderTechniquesTab(tabContent);
            break;
        case 'songs':
            renderSongsTab(tabContent);
            break;
        case 'stats':
            renderStatsTab(tabContent);
            break;
        case 'settings':
            renderSettingsTab(tabContent);
            break;
    }
    
    mainContent.appendChild(tabContent);
    appContainer.appendChild(mainContent);
    
    // Render delete confirmation modal if needed
    if (state.sessionToDelete) {
        renderDeleteModal();
    }
    
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Add event listeners
    addEventListeners();
}

function renderLogTab(container) {
    container.innerHTML = `
        <h2 class="text-xl font-bold mb-6">Log Practice Session</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label class="block text-gray-700 mb-2">Date</label>
                <input
                    type="date"
                    id="practice-date"
                    value="${state.formData.date}"
                    class="w-full border border-gray-300 rounded py-2 px-3"
                />
            </div>
            
            <div>
                <label class="block text-gray-700 mb-2">Duration (minutes)</label>
                <input
                    type="number"
                    id="practice-duration"
                    value="${state.formData.duration}"
                    class="w-full border border-gray-300 rounded py-2 px-3"
                    min="1"
                />
            </div>
        </div>
        
        <div class="mb-6">
            <label class="block text-gray-700 mb-2">Techniques Practiced</label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                ${state.techniques.map(tech => `
                    <div class="flex items-center">
                        <input
                            type="checkbox"
                            id="tech-${tech.id}"
                            ${state.formData.techniques.includes(tech.id) ? 'checked' : ''}
                            class="mr-2 tech-checkbox"
                            data-tech-id="${tech.id}"
                        />
                        <label for="tech-${tech.id}">${tech.name}</label>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="mb-6">
            <label class="block text-gray-700 mb-2">Songs Practiced</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                ${state.songs.map(song => `
                    <div class="flex items-center">
                        <input
                            type="checkbox"
                            id="song-${song.id}"
                            ${state.formData.songs.includes(song.id) ? 'checked' : ''}
                            class="mr-2 song-checkbox"
                            data-song-id="${song.id}"
                        />
                        <label for="song-${song.id}">${song.name}</label>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="mb-6">
            <label class="block text-gray-700 mb-2">Notes</label>
            <textarea
                id="practice-notes"
                class="w-full border border-gray-300 rounded py-2 px-3"
                rows="3"
            >${state.formData.notes}</textarea>
        </div>
        
        <button 
            id="save-practice-btn"
            class="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-150"
        >
            Save Practice Session
        </button>
    `;
    
    // Add recent sessions if available
    if (state.sessions.length > 0) {
        const recentSessionsDiv = document.createElement('div');
        recentSessionsDiv.className = 'mt-10';
        recentSessionsDiv.innerHTML = `
            <h3 class="text-lg font-bold mb-4">Recent Sessions</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th class="py-2 px-4 border-b text-left font-medium">Date</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Duration</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Techniques</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Songs</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${[...state.sessions].reverse().slice(0, 5).map(session => `
                            <tr>
                                <td class="py-2 px-4 border-b">${session.date}</td>
                                <td class="py-2 px-4 border-b">${session.duration} minutes</td>
                                <td class="py-2 px-4 border-b">
                                    ${session.techniques.map(techId => {
                                        const tech = state.techniques.find(t => t.id === techId);
                                        return tech ? tech.name : '';
                                    }).join(', ')}
                                </td>
                                <td class="py-2 px-4 border-b">
                                    ${session.songs.map(songId => {
                                        const song = state.songs.find(s => s.id === songId);
                                        return song ? song.name : '';
                                    }).join(', ')}
                                </td>
                                <td class="py-2 px-4 border-b">
                                    <button 
                                        class="text-red-600 hover:text-red-800 delete-session-btn"
                                        data-session-id="${session.id}"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.appendChild(recentSessionsDiv);
    }
}

function renderTechniquesTab(container) {
    container.innerHTML = `
        <h2 class="text-xl font-bold mb-6">Techniques</h2>
        
        <div class="mb-6 flex">
            <input
                type="text"
                id="new-technique-input"
                value="${state.newTechnique}"
                class="flex-1 border border-gray-300 rounded-l py-2 px-3"
                placeholder="Add new technique..."
            />
            <button 
                id="add-technique-btn"
                class="bg-indigo-600 text-white py-2 px-4 rounded-r hover:bg-indigo-700 transition duration-150"
            >
                Add
            </button>
        </div>
        
        <div class="grid grid-cols-1 gap-4">
            ${state.techniques.map(tech => `
                <div class="border rounded p-4">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold">${tech.name}</h3>
                        <span class="text-gray-500">Level: ${tech.level.toFixed(1)}/10</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded h-2">
                        <div 
                            class="bg-indigo-600 h-2 rounded" 
                            style="width: ${(tech.level / 10) * 100}%"
                        ></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderSongsTab(container) {
    container.innerHTML = `
        <h2 class="text-xl font-bold mb-6">Songs</h2>
        
        <div class="mb-6 flex">
            <input
                type="text"
                id="new-song-input"
                value="${state.newSong}"
                class="flex-1 border border-gray-300 rounded-l py-2 px-3"
                placeholder="Add new song..."
            />
            <button 
                id="add-song-btn"
                class="bg-indigo-600 text-white py-2 px-4 rounded-r hover:bg-indigo-700 transition duration-150"
            >
                Add
            </button>
        </div>
        
        <div class="grid grid-cols-1 gap-4">
            ${state.songs.map(song => `
                <div class="border rounded p-4">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-bold">${song.name}</h3>
                        <span class="text-gray-500">${song.progress.toFixed(1)}% Complete</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded h-2">
                        <div 
                            class="bg-indigo-600 h-2 rounded" 
                            style="width: ${song.progress}%"
                        ></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderStatsTab(container) {
    if (state.sessions.length === 0) {
        container.innerHTML = `
            <h2 class="text-xl font-bold mb-6">Practice Statistics</h2>
            <p>No practice data available yet. Start logging your practice sessions!</p>
        `;
        return;
    }
    
    const weeklyProgress = getWeeklyProgress();
    
    container.innerHTML = `
        <h2 class="text-xl font-bold mb-6">Practice Statistics</h2>
        
        <div class="mb-8">
            <h3 class="text-lg font-bold mb-4">Practice by Technique</h3>
            <div class="space-y-4">
                ${state.techniques.map(tech => {
                    const sessionsWithTech = state.sessions.filter(s => 
                        s.techniques.includes(tech.id)
                    ).length;
                    
                    const percentage = state.sessions.length > 0 
                        ? (sessionsWithTech / state.sessions.length) * 100 
                        : 0;
                    
                    return `
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <span>${tech.name}</span>
                                <span>${sessionsWithTech} sessions</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded h-4">
                                <div 
                                    class="bg-indigo-600 h-4 rounded" 
                                    style="width: ${percentage}%"
                                ></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="mb-8">
            <h3 class="text-lg font-bold mb-4">Weekly Goal Progress</h3>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="flex justify-between mb-2">
                    <span>Weekly Goal: ${state.settings.goalMinutesPerWeek} minutes</span>
                    <span>${weeklyProgress.minutes} / ${state.settings.goalMinutesPerWeek} minutes</span>
                </div>
                <div class="w-full bg-gray-200 rounded h-6">
                    <div 
                        class="bg-green-500 h-6 rounded" 
                        style="width: ${weeklyProgress.percentage}%"
                    ></div>
                </div>
            </div>
        </div>
        
        <div>
            <h3 class="text-lg font-bold mb-4">All Practice Sessions</h3>
            <div class="overflow-x-auto border rounded">
                <table class="min-w-full bg-white">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="py-2 px-4 border-b text-left font-medium">Date</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Duration</th>
                            <th class="py-2 px-4 border-b text-left font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${[...state.sessions]
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map(session => `
                                <tr>
                                    <td class="py-2 px-4 border-b">${session.date}</td>
                                    <td class="py-2 px-4 border-b">${session.duration} minutes</td>
                                    <td class="py-2 px-4 border-b">
                                        <button 
                                            class="text-red-600 hover:text-red-800 delete-session-btn"
                                            data-session-id="${session.id}"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderSettingsTab(container) {
    container.innerHTML = `
        <h2 class="text-xl font-bold mb-6">Practice Settings</h2>
        
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-semibold mb-3">Progress Requirements</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-700 mb-2">
                            Minutes to Level Up a Technique
                        </label>
                        <div class="flex items-center">
                            <input
                                type="number"
                                id="level-up-minutes"
                                value="${state.settings.levelUpMinutes}"
                                class="w-full border border-gray-300 rounded py-2 px-3"
                                min="1"
                            />
                            <span class="ml-2">minutes</span>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">
                            Time required to advance a technique by 1 level (max 10)
                        </p>
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 mb-2">
                            Minutes to Complete a Song
                        </label>
                        <div class="flex items-center">
                            <input
                                type="number"
                                id="song-completion-minutes"
                                value="${state.settings.songCompletionMinutes}"
                                class="w-full border border-gray-300 rounded py-2 px-3"
                                min="1"
                            />
                            <span class="ml-2">minutes</span>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">
                            Time required to reach 100% completion on a song
                        </p>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 class="text-lg font-semibold mb-3">Goals & Streaks</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-700 mb-2">
                            Weekly Practice Goal
                        </label>
                        <div class="flex items-center">
                            <input
                                type="number"
                                id="goal-minutes-per-week"
                                value="${state.settings.goalMinutesPerWeek}"
                                class="w-full border border-gray-300 rounded py-2 px-3"
                                min="1"
                            />
                            <span class="ml-2">minutes per week</span>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">
                            Your target practice time each week
                        </p>
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 mb-2">
                            Minimum Minutes for Streak
                        </label>
                        <div class="flex items-center">
                            <input
                                type="number"
                                id="streak-threshold"
                                value="${state.settings.streakThreshold}"
                                class="w-full border border-gray-300 rounded py-2 px-3"
                                min="1"
                            />
                            <span class="ml-2">minutes</span>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">
                            Minimum practice time for a day to count toward your streak
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="bg-indigo-50 p-4 rounded-lg mt-6">
                <h3 class="text-lg font-semibold text-indigo-800 mb-2">Settings Overview</h3>
                <ul class="space-y-2">
                    <li class="flex flex-wrap">
                        <span class="text-indigo-800 font-medium w-64">Technique Leveling:</span>
                        <span>${(10 / state.settings.levelUpMinutes).toFixed(2)} levels per hour</span>
                    </li>
                    <li class="flex flex-wrap">
                        <span class="text-indigo-800 font-medium w-64">Song Progress:</span>
                        <span>${(100 / state.settings.songCompletionMinutes).toFixed(2)}% per hour</span>
                    </li>
                    <li class="flex flex-wrap">
                        <span class="text-indigo-800 font-medium w-64">Daily Practice Goal:</span>
                        <span>${Math.round(state.settings.goalMinutesPerWeek / 7)} minutes per day</span>
                    </li>
                </ul>
            </div>
        </div>
    `;
}

function renderDeleteModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.id = 'delete-modal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 class="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p class="mb-6">
                Are you sure you want to delete this practice session from ${state.sessionToDelete.date} (${state.sessionToDelete.duration} minutes)?
                This will reverse all progress made during this session.
            </p>
            <div class="flex justify-end space-x-4">
                <button
                    id="cancel-delete-btn"
                    class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition duration-150"
                >
                    Cancel
                </button>
                <button
                    id="confirm-delete-btn"
                    class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-150"
                >
                    Delete
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for modal
    document.getElementById('cancel-delete-btn').addEventListener('click', () => {
        state.sessionToDelete = null;
        document.getElementById('delete-modal').remove();
    });
    
    document.getElementById('delete-modal').addEventListener('click', (e) => {
        if (e.target.id === 'delete-modal') {
            state.sessionToDelete = null;
            document.getElementById('delete-modal').remove();
        }
    });
    
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        deleteSession(state.sessionToDelete);
        document.getElementById('delete-modal').remove();
    });
}

function addEventListeners() {
    // Tab navigation
    document.getElementById('tab-log').addEventListener('click', () => {
        state.activeTab = 'log';
        render();
    });
    
    document.getElementById('tab-techniques').addEventListener('click', () => {
        state.activeTab = 'techniques';
        render();
    });
    
    document.getElementById('tab-songs').addEventListener('click', () => {
        state.activeTab = 'songs';
        render();
    });
    
    document.getElementById('tab-stats').addEventListener('click', () => {
        state.activeTab = 'stats';
        render();
    });
    
    document.getElementById('tab-settings').addEventListener('click', () => {
        state.activeTab = 'settings';
        render();
    });
    
    // Tab-specific listeners
    switch(state.activeTab) {
        case 'log':
            addLogTabListeners();
            break;
        case 'techniques':
            addTechniquesTabListeners();
            break;
        case 'songs':
            addSongsTabListeners();
            break;
        case 'settings':
            addSettingsTabListeners();
            break;
    }
}

function addLogTabListeners() {
    // Form field change listeners
    document.getElementById('practice-date').addEventListener('change', (e) => {
        state.formData.date = e.target.value;
    });
    
    document.getElementById('practice-duration').addEventListener('change', (e) => {
        state.formData.duration = Number(e.target.value);
    });
    
    document.getElementById('practice-notes').addEventListener('input', (e) => {
        state.formData.notes = e.target.value;
    });
    
    // Technique checkboxes
    const techCheckboxes = document.querySelectorAll('.tech-checkbox');
    techCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const techId = Number(e.target.dataset.techId);
            if (e.target.checked) {
                if (!state.formData.techniques.includes(techId)) {
                    state.formData.techniques.push(techId);
                }
            } else {
                state.formData.techniques = state.formData.techniques.filter(id => id !== techId);
            }
        });
    });
    
    // Song checkboxes
    const songCheckboxes = document.querySelectorAll('.song-checkbox');
    songCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const songId = Number(e.target.dataset.songId);
            if (e.target.checked) {
                if (!state.formData.songs.includes(songId)) {
                    state.formData.songs.push(songId);
                }
            } else {
                state.formData.songs = state.formData.songs.filter(id => id !== songId);
            }
        });
    });
    
    // Save button
    document.getElementById('save-practice-btn').addEventListener('click', saveSession);
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-session-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const sessionId = Number(e.target.dataset.sessionId);
            const session = state.sessions.find(s => s.id === sessionId);
            if (session) {
                state.sessionToDelete = session;
                render();
            }
        });
    });
}

function addTechniquesTabListeners() {
    document.getElementById('new-technique-input').addEventListener('input', (e) => {
        state.newTechnique = e.target.value;
    });
    
    document.getElementById('add-technique-btn').addEventListener('click', addTechnique);
}

function addSongsTabListeners() {
    document.getElementById('new-song-input').addEventListener('input', (e) => {
        state.newSong = e.target.value;
    });
    
    document.getElementById('add-song-btn').addEventListener('click', addSong);
}

function addSettingsTabListeners() {
    document.getElementById('level-up-minutes').addEventListener('change', (e) => {
        state.settings.levelUpMinutes = Math.max(1, Number(e.target.value));
        saveToLocalStorage();
        render();
    });
    
    document.getElementById('song-completion-minutes').addEventListener('change', (e) => {
        state.settings.songCompletionMinutes = Math.max(1, Number(e.target.value));
        saveToLocalStorage();
        render();
    });
    
    document.getElementById('goal-minutes-per-week').addEventListener('change', (e) => {
        state.settings.goalMinutesPerWeek = Math.max(1, Number(e.target.value));
        saveToLocalStorage();
        render();
    });
    
    document.getElementById('streak-threshold').addEventListener('change', (e) => {
        state.settings.streakThreshold = Math.max(1, Number(e.target.value));
        saveToLocalStorage();
        render();
    });
}

function saveSession() {
    // Validate form data
    if (!state.formData.date || state.formData.duration < 1) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newSession = {
        id: Date.now(),
        date: state.formData.date,
        duration: state.formData.duration,
        techniques: [...state.formData.techniques],
        songs: [...state.formData.songs],
        notes: state.formData.notes
    };
    
    // Add to sessions
    state.sessions.push(newSession);
    
    // Update technique levels
    state.techniques = state.techniques.map(tech => {
        if (state.formData.techniques.includes(tech.id)) {
            const levelIncrease = state.formData.duration / state.settings.levelUpMinutes;
            return { 
                ...tech, 
                level: Math.min(tech.level + levelIncrease, 10) 
            };
        }
        return tech;
    });
    
    // Update song progress
    state.songs = state.songs.map(song => {
        if (state.formData.songs.includes(song.id)) {
            const progressIncrease = (state.formData.duration / state.settings.songCompletionMinutes) * 100;
            return { 
                ...song, 
                progress: Math.min(song.progress + progressIncrease, 100) 
            };
        }
        return song;
    });
    
    // Reset form
    state.formData = {
        date: new Date().toISOString().split('T')[0],
        duration: 30,
        techniques: [],
        songs: [],
        notes: ''
    };
    
    // Save to localStorage and re-render
    saveToLocalStorage();
    render();
}

function addTechnique() {
    if (state.newTechnique.trim()) {
        state.techniques.push({
            id: Date.now(),
            name: state.newTechnique,
            level: 0
        });
        
        state.newTechnique = '';
        saveToLocalStorage();
        render();
    }
}

function addSong() {
    if (state.newSong.trim()) {
        state.songs.push({
            id: Date.now(),
            name: state.newSong,
            progress: 0
        });
        
        state.newSong = '';
        saveToLocalStorage();
        render();
    }
}

function deleteSession(session) {
    // Reverse technique level increases
    state.techniques = state.techniques.map(tech => {
        if (session.techniques.includes(tech.id)) {
            const levelDecrease = session.duration / state.settings.levelUpMinutes;
            return {
                ...tech,
                level: Math.max(0, tech.level - levelDecrease)
            };
        }
        return tech;
    });
    
    // Reverse song progress
    state.songs = state.songs.map(song => {
        if (session.songs.includes(song.id)) {
            const progressDecrease = (session.duration / state.settings.songCompletionMinutes) * 100;
            return {
                ...song,
                progress: Math.max(0, song.progress - progressDecrease)
            };
        }
        return song;
    });
    
    // Remove session and clear sessionToDelete
    state.sessions = state.sessions.filter(s => s.id !== session.id);
    state.sessionToDelete = null;
    
    // Save to localStorage and re-render
    saveToLocalStorage();
    render();
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    render();
});