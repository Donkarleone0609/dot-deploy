import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, set, get } from 'firebase/database';
import { useLocation, Link } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import './ReferralPage.css';

const ReferralPage = () => {
    const [chatId, setChatId] = useState('');
    const [referralLink, setReferralLink] = useState('');
    const [referralCount, setReferralCount] = useState(0);
    const [referralsList, setReferralsList] = useState([]);
    const [error, setError] = useState('');
    const location = useLocation();

    useEffect(() => {
        if (WebApp.initDataUnsafe.user) {
            setChatId(WebApp.initDataUnsafe.user.id);
        } else {
            setError('Chat ID not found. Please open this page via Telegram bot.');
        }
    }, []);

    const generateReferralLink = async () => {
        if (!chatId) {
            setError('Chat ID is required to generate a referral link.');
            return;
        }

        try {
            const referralRef = ref(database, `referrals/${chatId}`);
            const snapshot = await get(referralRef);

            if (!snapshot.exists()) {
                await set(referralRef, {
                    referralCount: 0,
                    referrals: [],
                    invitedBy: [],
                });
            }

            const link = `https://t.me/whoisd0t_bot?start=${chatId}`;
            setReferralLink(link);
            setError('');
        } catch (err) {
            console.error('Error generating referral link:', err);
            setError('Failed to generate referral link. Please try again.');
        }
    };

    useEffect(() => {
        if (chatId) {
            const referralRef = ref(database, `referrals/${chatId}`);
            get(referralRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setReferralCount(data.referralCount || 0);
                    setReferralsList(data.referrals || []);
                }
            }).catch((err) => {
                console.error('Error fetching referral data:', err);
                setError('Failed to fetch referral data. Please try again.');
            });
        }
    }, [chatId]);

    const copyToClipboard = () => {
        if (referralLink) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(referralLink)
                    .then(() => alert('Referral link copied to clipboard!'))
                    .catch(() => alert('Failed to copy referral link. Please try again.'));
            } else {
                alert('Clipboard API is not supported in your browser.');
            }
        }
    };

    return (
        <div className="referral-page">
            <h1>Referral System</h1>

            <div className="generate-link">
                <button onClick={generateReferralLink} className="generate-button">
                    Generate Referral Link
                </button>
            </div>

            {referralLink && (
                <div className="referral-link">
                    <p>Your Referral Link:</p>
                    <a href={referralLink} className="link">
                        {referralLink}
                    </a>
                    <button onClick={copyToClipboard} className="copy-button">
                        Copy Link
                    </button>
                </div>
            )}

            <div className="referral-count">
                <p>Total Referrals: {referralCount}</p>
            </div>

            {referralsList.length > 0 && (
                <div className="referrals-list">
                    <h3>Referrals List:</h3>
                    <ul>
                        {referralsList.map((refChatId, index) => (
                            <li key={index}>User ID: {refChatId}</li>
                        ))}
                    </ul>
                </div>
            )}

            {error && <p className="error">{error}</p>}

            <NavigationBar />
        </div>
    );
};

const NavigationBar = () => (
    <div className="navigation-bar">
        <Link to="/referral" className="nav-button">Referral</Link>
        <Link to="/" className="nav-button">Home</Link>
        <Link to="/click-counter" className="nav-button">Clicker</Link>
        <Link to="/rewards" className="nav-button">Rewards</Link>
    </div>
);

export default ReferralPage;
