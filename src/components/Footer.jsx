import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">MS Special</h3>
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
                <span className="text-sm">{import.meta.env.VITE_STORE_LOCATION || 'Okaishei - Accra'}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href={`tel:${import.meta.env.VITE_STORE_PHONE || '+233242988277'}`} className="text-sm hover:text-white transition">
                  {import.meta.env.VITE_STORE_PHONE || '+233 24 298 8277'}
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href={`mailto:${import.meta.env.VITE_STORE_EMAIL || 'msfoods.gh@gmail.com'}`} className="text-sm hover:text-white transition">
                  {import.meta.env.VITE_STORE_EMAIL || 'msfoods.gh@gmail.com'}
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-white transition">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-white transition">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {currentYear} MS Special. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
