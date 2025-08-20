import React from 'react';
const AboutPage = () => (
        <AboutContent />
);
const AboutContent = () => (
    <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">About Seefu.TV</h1>
        <section>
            <h2>Our Mission</h2>
            <p>
                Seefu.TV is dedicated to bringing you the best in online entertainment. Our mission is to connect viewers with high-quality content from creators around the world.
            </p>
        </section>
        <section>
            <h2>Our Vision</h2>
            <p>
                We believe in empowering creators and providing audiences with diverse, engaging, and accessible media experiences.
            </p>
        </section>
        <section>
            <h2>Contact Us</h2>
            <p>
                Have questions or feedback? Reach out to us at <a href="mailto:info@seefu.tv">info@seefu.tv</a>.
            </p>
        </section>
    </main>
);

export default AboutPage;