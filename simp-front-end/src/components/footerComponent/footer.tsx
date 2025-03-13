import React from "react";
import styles from "./footer.module.css"; // Correct way to import CSS module

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Company Info */}
        <div className={styles.footerColumn}>
          <h3>Simpleza</h3>
          <p>For a better tomorrow.</p>
        </div>

        {/* Services */}
        <div className={styles.footerColumn}>
          <h3>Our Services</h3>
          <ul>
            <li><a href="/web-development">Sign up</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/support">Support</a></li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className={styles.footerColumn}>
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/terms-and-policies">Terms and Policies</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div className={styles.footerColumn}>
          <h3>Contact</h3>
          <p>
            <a href="/contact" className={styles.footerLink}>Get in touch with us</a>
          </p>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} Simpleza. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
