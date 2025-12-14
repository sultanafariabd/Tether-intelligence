#!/bin/bash

# Tether Intelligence - VNC Setup Script
# This script sets up a simple VNC server for testing the AI Computer Agent

echo "🚀 Setting up VNC Server for Tether Intelligence AI Agent..."

# Check if we're on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo "❌ This script is designed for Linux systems only"
    exit 1
fi

# Install required packages
echo "📦 Installing VNC server and dependencies..."
sudo apt update
sudo apt install -y x11vnc xvfb fluxbox

# Create VNC password
echo "🔐 Setting up VNC password..."
echo "Please enter a password for VNC access:"
x11vnc -storepasswd ~/.vnc/passwd

# Create VNC startup script
echo "📝 Creating VNC startup script..."
cat > ~/start_vnc.sh << 'EOF'
#!/bin/bash

# Start virtual display
Xvfb :1 -screen 0 1440x900x24 &
XVFB_PID=$!

# Start window manager
sleep 2
fluxbox &
FLUXBOX_PID=$!

# Start VNC server
sleep 2
x11vnc -display :1 -forever -shared -rfbauth ~/.vnc/passwd -rfbport 5900 -geometry 1440x900

# Cleanup function
cleanup() {
    echo "Cleaning up..."
    kill $XVFB_PID 2>/dev/null
    kill $FLUXBOX_PID 2>/dev/null
    killall Xvfb 2>/dev/null
    killall fluxbox 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

echo "✅ VNC Server started on port 5900"
echo "🌐 Connect using: vncviewer localhost:5900"
echo "📱 Or use the web interface at: http://localhost:6080 (if noVNC is running)"
echo "⏹️  Press Ctrl+C to stop the server"

# Keep script running
while true; do
    sleep 1
done
EOF

# Make the script executable
chmod +x ~/start_vnc.sh

# Create systemd service (optional)
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/tether-vnc.service > /dev/null << EOF
[Unit]
Description=Tether Intelligence VNC Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME
ExecStart=$HOME/start_vnc.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Instructions
echo ""
echo "✅ VNC setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the VNC server: ~/start_vnc.sh"
echo "2. Or enable as service: sudo systemctl enable tether-vnc && sudo systemctl start tether-vnc"
echo "3. Test connection: vncviewer localhost:5900"
echo ""
echo "🔗 Configuration for the AI Agent:"
echo "   VNC Host: localhost"
echo "   VNC Port: 5900"
echo "   Screen Resolution: 1440x900"
echo ""
echo "⚠️  Note: This is a basic setup for testing. For production use,"
echo "   consider using a more secure VNC configuration with SSL/TLS."
echo ""
echo "🛑 To stop the VNC server: Press Ctrl+C or run 'sudo systemctl stop tether-vnc'"