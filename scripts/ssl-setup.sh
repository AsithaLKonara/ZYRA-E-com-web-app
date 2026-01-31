#!/bin/bash

# SSL Certificate Setup Script for ZYRA Fashion
# This script sets up SSL certificates using Let's Encrypt

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="zyra-ultra.com"
EMAIL="admin@zyra-ultra.com"
WEBROOT="/var/www/html"
SSL_DIR="/etc/ssl/certs"
SSL_KEY_DIR="/etc/ssl/private"
NGINX_CONF="/etc/nginx/sites-available/zyra-ultra"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Install Certbot
install_certbot() {
    log "Installing Certbot..."
    
    # Update package list
    apt update
    
    # Install snapd if not installed
    if ! command -v snap >/dev/null 2>&1; then
        apt install -y snapd
    fi
    
    # Install certbot via snap
    snap install core; snap refresh core
    snap install --classic certbot
    
    # Create symlink
    ln -sf /snap/bin/certbot /usr/bin/certbot
    
    success "Certbot installed"
}

# Generate SSL certificate
generate_certificate() {
    log "Generating SSL certificate for $DOMAIN..."
    
    # Stop nginx temporarily
    systemctl stop nginx
    
    # Generate certificate
    certbot certonly \
        --webroot \
        --webroot-path=$WEBROOT \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN,www.$DOMAIN
    
    # Check if certificate was generated
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        success "SSL certificate generated"
    else
        error "Failed to generate SSL certificate"
    fi
}

# Configure Nginx for SSL
configure_nginx() {
    log "Configuring Nginx for SSL..."
    
    # Create nginx configuration
    cat > $NGINX_CONF << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
    }
}
EOF

    # Enable site
    ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    nginx -t
    
    # Start nginx
    systemctl start nginx
    systemctl enable nginx
    
    success "Nginx configured for SSL"
}

# Setup auto-renewal
setup_auto_renewal() {
    log "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /usr/local/bin/renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx"
EOF
    
    chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/renew-ssl.sh") | crontab -
    
    success "Auto-renewal configured"
}

# Test SSL configuration
test_ssl() {
    log "Testing SSL configuration..."
    
    # Test nginx configuration
    nginx -t
    
    # Test SSL certificate
    if openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        success "SSL certificate is valid"
    else
        warning "SSL certificate validation failed"
    fi
    
    # Test HTTPS redirect
    if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "301"; then
        success "HTTP to HTTPS redirect is working"
    else
        warning "HTTP to HTTPS redirect failed"
    fi
}

# Setup SSL monitoring
setup_monitoring() {
    log "Setting up SSL monitoring..."
    
    # Create monitoring script
    cat > /usr/local/bin/ssl-monitor.sh << EOF
#!/bin/bash
DOMAIN="$DOMAIN"
EMAIL="$EMAIL"

# Check certificate expiry
EXPIRY_DATE=\$(openssl s_client -connect \$DOMAIN:443 -servername \$DOMAIN 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
EXPIRY_TIMESTAMP=\$(date -d "\$EXPIRY_DATE" +%s)
CURRENT_TIMESTAMP=\$(date +%s)
DAYS_UNTIL_EXPIRY=\$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))

if [ \$DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo "SSL certificate for \$DOMAIN expires in \$DAYS_UNTIL_EXPIRY days" | mail -s "SSL Certificate Expiry Warning" \$EMAIL
fi
EOF
    
    chmod +x /usr/local/bin/ssl-monitor.sh
    
    # Add to crontab (check daily)
    (crontab -l 2>/dev/null; echo "0 9 * * * /usr/local/bin/ssl-monitor.sh") | crontab -
    
    success "SSL monitoring configured"
}

# Main function
main() {
    log "Starting SSL setup for $DOMAIN..."
    
    check_root
    install_certbot
    generate_certificate
    configure_nginx
    setup_auto_renewal
    test_ssl
    setup_monitoring
    
    success "SSL setup completed successfully!"
    log "Your site is now available at https://$DOMAIN"
}

# Run main function
main "$@"




