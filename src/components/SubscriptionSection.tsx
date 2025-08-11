'use client';
import React, { useState } from 'react';
import type { VideoSrc } from '@/types/VideoSrc';
import Image from "next/image";
import { FiGift } from "react-icons/fi";

const subscriptionPackages = [
    {
        id: "basic",
        name: "Basic",
        price: 9.99,
        features: [
            "Access to online TV channels",
            "Standard definition streaming",
            "Watch on 1 device at a time",
            "Limited movie library"
        ],
        image: "/images/packages/basic.png"
    },
    {
        id: "standard",
        name: "Standard",
        price: 14.99,
        features: [
            "Access to online TV channels",
            "High definition streaming",
            "Watch on 2 devices at a time",
            "Extended movie library"
        ],
        image: "/images/packages/standard.png"
    },
    {
        id: "premium",
        name: "Premium",
        price: 19.99,
        features: [
            "Access to online TV channels",
            "Ultra HD streaming",
            "Watch on 4 devices at a time",
            "Full movie library",
            "Offline downloads"
        ],
        image: "/images/packages/premium.png"
    }
];

const SubscriptionSection: React.FC = () => {

    return (
        <div className="container mx-auto px-4 py-8 ">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-[#e50914] text-3xl mr-2">
                        <FiGift />
                    </span>
                    <h2 className="text-2xl font-bold">Subscribe Now</h2>
                </div>
                
            </div>
            <div className="flex justify-center bg-[#e50914] rounded-lg p-4 mb-6">
                
                <div className={`hide-scrollbar grid grid-flow-col auto-cols-[70%] sm:auto-cols-[45%] lg:auto-cols-[30%] gap-4 p-4 overflow-x-scroll`}>
                    {subscriptionPackages.map((packageItem, index) => (
                        <div
                            key={packageItem.id}
                            className={`flex flex-1 flex-col bg-black shadow-[0px_0px_2px_1px] pb-2 shadow-[#e50914] rounded-lg touchable hover:scale-105 transition-transform duration-300 cursor-pointer hover:bg-white/90 group`}
                        >
                            <div className="relative w-full h-auto rounded-lg mb-2">
                                {/* <Image
                                    src={packageItem.image}
                                    alt={packageItem.name}
                                    width={300}
                                    height={200}
                                    className="z-0 rounded-t-lg object-cover"
                                /> */}
                            </div>
                            <div className='relative px-4 overflow-y-visible z-1 pb-5'>
                                <h1 className="text-xl md:text-4xl font-bold text-center py-10 bg-gradient-to-r from-[#e50914] to-[#db0000] text-[#e50914] bg-clip-text group-hover:bg-none transition-colors duration-300">{packageItem.name}</h1>
                                <h4 className="text-xs md:text-xl text-white font-bold group-hover:text-black transition-colors duration-300">${packageItem.price.toFixed(2)} / month</h4>
                                <ul className="text-xs md:text-sm text-gray-400 mt-2 group-hover:text-black transition-colors duration-300">
                                    {packageItem.features.map((feature, idx) => (
                                        <li key={idx} className="list-disc ml-4">{feature}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default SubscriptionSection;

