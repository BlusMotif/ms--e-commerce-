import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter, 
  Globe, 
  Linkedin, 
  Youtube, 
  MessageCircle,
  Send,
  Hash,
  Github,
  Music
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Function to get the appropriate icon based on platform name
  const getSocialIcon = (platformName) => {
    const name = platformName.toLowerCase().trim();
    
    // Map platform names to their icons
    if (name.includes('facebook')) return Facebook;
    if (name.includes('instagram')) return Instagram;
    if (name.includes('twitter') || name.includes('x.com')) return Twitter;
    if (name.includes('linkedin')) return Linkedin;
    if (name.includes('youtube')) return Youtube;
    if (name.includes('whatsapp')) return MessageCircle;
    if (name.includes('telegram')) return Send;
    if (name.includes('tiktok')) return Music;
    if (name.includes('github')) return Github;
    if (name.includes('discord') || name.includes('reddit')) return Hash;
    if (name.includes('snapchat')) return MessageCircle;
    if (name.includes('pinterest')) return Hash;
    
    // Default icon
    return Globe;
  };

  const [settings, setSettings] = useState({
    storeAddress: 'Okaishei - Accra',
    storePhone: '+233 24 298 8277',
    storeEmail: 'msfoods.gh@gmail.com',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    socialMediaLinks: [],
  });

  useEffect(() => {
    const settingsRef = ref(database, 'settings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSettings({
          storeAddress: data.storeAddress || 'Okaishei - Accra',
          storePhone: data.storePhone || '+233 24 298 8277',
          storeEmail: data.storeEmail || 'msfoods.gh@gmail.com',
          facebookUrl: data.facebookUrl || '',
          instagramUrl: data.instagramUrl || '',
          twitterUrl: data.twitterUrl || '',
          socialMediaLinks: data.socialMediaLinks || [],
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">MS</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-gray-900"></div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white text-xl font-bold">MS Special</span>
                <span className="text-xs text-gray-400">Quality Products</span>
              </div>
            </div>
            <p className="text-sm">
              Your one-stop shop for premium Shito pepper sauce, stylish dresses, and quality bags.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products?category=shito" className="text-sm hover:text-white transition">
                  Shito
                </Link>
              </li>
              <li>
                <Link to="/products?category=dresses" className="text-sm hover:text-white transition">
                  Dresses
                </Link>
              </li>
              <li>
                <Link to="/products?category=bags" className="text-sm hover:text-white transition">
                  Bags
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-sm hover:text-white transition">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{settings.storeAddress}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href={`tel:${settings.storePhone}`} className="text-sm hover:text-white transition">
                  {settings.storePhone}
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href={`mailto:${settings.storeEmail}`} className="text-sm hover:text-white transition">
                  {settings.storeEmail}
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Follow Us</h3>
            {(settings.facebookUrl || settings.instagramUrl || settings.twitterUrl || (settings.socialMediaLinks && settings.socialMediaLinks.length > 0)) ? (
              <div className="flex flex-wrap gap-4">
                {settings.facebookUrl && (
                  <a 
                    href={settings.facebookUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group hover:text-white transition transform hover:scale-110 duration-200 flex flex-col items-center"
                    title="Follow us on Facebook"
                  >
                    <Facebook className="w-6 h-6" />
                    <span className="text-xs mt-1 opacity-75 group-hover:opacity-100">Facebook</span>
                  </a>
                )}
                {settings.instagramUrl && (
                  <a 
                    href={settings.instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group hover:text-white transition transform hover:scale-110 duration-200 flex flex-col items-center"
                    title="Follow us on Instagram"
                  >
                    <Instagram className="w-6 h-6" />
                    <span className="text-xs mt-1 opacity-75 group-hover:opacity-100">Instagram</span>
                  </a>
                )}
                {settings.twitterUrl && (
                  <a 
                    href={settings.twitterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group hover:text-white transition transform hover:scale-110 duration-200 flex flex-col items-center"
                    title="Follow us on Twitter"
                  >
                    <Twitter className="w-6 h-6" />
                    <span className="text-xs mt-1 opacity-75 group-hover:opacity-100">Twitter</span>
                  </a>
                )}
                {settings.socialMediaLinks && settings.socialMediaLinks.map((link, index) => {
                  if (!link.url || !link.platform) return null;
                  
                  const IconComponent = getSocialIcon(link.platform);
                  
                  return (
                    <a 
                      key={index}
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group hover:text-white transition transform hover:scale-110 duration-200 flex flex-col items-center"
                      title={`Follow us on ${link.platform}`}
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className="text-xs mt-1 opacity-75 group-hover:opacity-100">{link.platform}</span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Connect with us on social media!</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {currentYear} MS Special. All rights reserved.</p>
          <p className="mt-2 text-gray-400">
            Developed by{' '}
            <a 
              href="https://blusmotif.netlify.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 transition font-semibold"
            >
              BlusMotif (Eleblu Nunana)
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
