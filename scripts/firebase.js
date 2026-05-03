// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyA9O3oyQbUUfqqfwFqCU-H4C4NJUKwkAtk",
    authDomain: "kindle-md.firebaseapp.com",
    projectId: "kindle-md",
    storageBucket: "kindle-md.firebasestorage.app",
    messagingSenderId: "186674507289",
    appId: "1:186674507289:web:ad849d2357faf34678c488",
    measurementId: "G-WPV6BCRQJM"
}

firebase.initializeApp(firebaseConfig)
var db = firebase.firestore()


// Vars
var loginBox = document.getElementById('login')
var newDocBox = document.getElementById('new-doc-modal')
var newDocInput = document.getElementById('new-doc-input')
var box = document.getElementById('box')
var navigation = document.getElementById('navigation')
var editBtn = document.getElementById('edit-btn')
var loginTab = document.getElementById('login-tab')
var signupTab = document.getElementById('signup-tab')
var logoutTab = document.getElementById('logout-tab')
var loginErr = document.getElementById('login-err')
var signupErr = document.getElementById('signup-err')
var signoutErr = document.getElementById('singout-err')

var currentUser = null
var currentDoc = null
var currentDocTitle = null
var editing = false

// Modals
function showNewDoc() {
    if (!newDocBox) return

        if (newDocBox.style.display === 'none' || newDocBox.style.display === '') {
        newDocBox.style.display = 'block'
        newDocInput.focus()
        document.getElementById('new-doc-confirm').onclick = confirmNewDoc
            document.getElementById('new-doc-cancel').onclick = showNewDoc

            newDocInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') confirmNewDoc()
            })

    } else {
        newDocBox.style.display = 'none'
    }

}


function showLogin() {
    if (!loginBox) return

    if (loginBox.style.display === 'none' || loginBox.style.display === '') {
        loginBox.style.display = 'block'

        var tab = document.getElementById('login-tab')
        if (tab) openTab({ currentTarget: tab }, 'tab-login')
    } else {
        loginBox.style.display = 'none'
    }
}

// Auth
function subSignup() {
    var email = document.getElementById('email').value
    var password = document.getElementById('password').value

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function () {
            alert('Account created')
        })
        .catch(function (err) {
            signupErr.textContent = (err.message)
        })
}

function subLogin() {
    var email = document.getElementById('email-l').value
    var password = document.getElementById('password-l').value

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function (userCredential) {
            var user = userCredential.user

            loginBox.classList.remove('active')

            var pill = document.querySelector('.userpill p')
            if (pill) pill.textContent = ' ' + (user.displayName || user.email)
            loadDocs(user.uid)
            showLogin()
        })
        .catch(function (err) {
            loginErr.textContent = (err.message)
        })
}

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        currentUser = user

        var pill = document.querySelector('.userpill p')
        if (pill) pill.textContent = ' ' + (user.displayName || user.email)

        loadDocs(user.uid)
    } else {
        currentUser = null
        showLogin()
    }
})

// logout
function logout() {
        firebase.auth().signOut().then(function () {
        location.reload()
             .catch(function (err) {
            signoutErr.textContent = (err.message)
        })
    })
}


// Loads doc from firestore
function loadDocs(userId) {
    db.collection('users').doc(userId).collection('docs').get()
        .then(function (snapshot) {

            var links = navigation.querySelectorAll('a')
            for (var i = 0; i < links.length; i++) {
                links[i].remove()
            }

            snapshot.forEach(function (doc) {
                addDocToSidebar(doc.id, doc.data().title)
            })
        })
        .catch(function (err) {
            alert(err.message)
        })
}

// Add Doc to sidebar
function addDocToSidebar(docId, title) {
    var a = document.createElement('a')
    a.textContent = title
    a.dataset.id = docId
    attachLinkHandler(a)
    navigation.appendChild(a)
}

function attachLinkHandler(link) {
    link.onclick = function (e) {
        e.preventDefault()
    var links = navigation.querySelectorAll('a')
    for (var i = 0; i < links.length; i++) {
        links[i].classList.remove('active')
    }
        currentDoc = this.dataset.id
        currentDocTitle = this.textContent
        this.classList.add('active')
        loadDoc(currentDoc)
    }
}


// load single Doc
function loadDoc(docId) {
    db.collection('users').doc(currentUser.uid).collection('docs').doc(docId).get()
        .then(function (doc) {
            if (doc.exists) {
                var content = doc.data().content
                box.innerHTML = content ? marked.parse(content) : 'Click Pencil To Edit'
            } else {
                box.innerHTML = '<p>Document not found</p>'
            }
        })
        .catch(function (err) {
            box.innerHTML = '<p>Error: ' + err.message + '</p>'
        })
}

// Save doc to firebase
function saveDoc(docId, content) {
    db.collection('users').doc(currentUser.uid).collection('docs').doc(docId).set({
        title: currentDocTitle,
        content: content
    })
}


// new doc
function confirmNewDoc() {
  
    var title = newDocInput.value.trim()
    newDocBox.style.display = 'none'
    if (!title || !currentUser) return

    currentDocTitle = title
    db.collection('users').doc(currentUser.uid).collection('docs').add({
        title: title,
        content: ''
    }).then(function (docRef) {
        addDocToSidebar(docRef.id, title)
    })
}


// Delete Doc
function deleteCurrentDoc() {
    if (!currentUser || !currentDoc) return

        db.collection('users').doc(currentUser.uid).collection('docs').doc(currentDoc).delete()
        .then(function () {

            var link = navigation.querySelector('a[data-id="' + currentDoc + '"]')
            if (link) link.remove()

            currentDoc = null
            currentDocTitle = null


            editing = false
            editBtn.textContent = '󰏫'
        })
}


// Edit button
function toggleEdit() {
    if (!currentDoc || !currentUser) return

    if (!editing) {
        db.collection('users').doc(currentUser.uid).collection('docs').doc(currentDoc).get()
            .then(function (doc) {
                box.innerHTML = '<textarea id="editor">' + doc.data().content + '</textarea>'
                editBtn.textContent = '󰆓'
                editing = true
            })
    } else {
        var content = document.getElementById('editor').value
        saveDoc(currentDoc, content)
        box.innerHTML = marked.parse(content)
        editBtn.textContent = '󰏫'
        editing = false
    }
}

// Sidebar
var navToggle = document.querySelector('.nav-toggle')

if (navToggle) {
    navToggle.onclick = function () {
        navigation.classList.toggle('nav-open')
        document.body.classList.toggle('nav-open')
    }
}


// Login Tabs
function openTab(evt, tabName) {
    var tabcontent = document.getElementsByClassName('tabcontent')
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none'
    }

    var tablinks = document.getElementsByClassName('tablinks')
    for (var j = 0; j < tablinks.length; j++) {
        tablinks[j].className = tablinks[j].className.replace(' active', '')
    }

    var el = document.getElementById(tabName)
    if (el) el.style.display = 'block'

    evt.currentTarget.className += ' active'
}

// Bindings
document.getElementById('submit-btn').onclick = subSignup
document.getElementById('loginsub-btn').onclick = subLogin
document.getElementById('delete-btn').onclick = deleteCurrentDoc
document.getElementById('signout-btn').onclick = logout
document.getElementById('new-btn').onclick = showNewDoc
editBtn.onclick = toggleEdit
if (loginTab) loginTab.onclick = function (e) { openTab(e, 'tab-login') }
if (signupTab) signupTab.onclick = function (e) { openTab(e, 'tab-signup') }
if (logoutTab) logoutTab.onclick = function (e) { openTab(e, 'tab-signout') }

