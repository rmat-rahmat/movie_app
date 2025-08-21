'use client';
import React, { useState } from 'react';
import type { VideoSrc } from '@/types/VideoSrc';
import Image from "next/image";
import { FiGift, FiCheck } from "react-icons/fi";

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
            <div className="flex items-center lg:justify-center mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-[#e50914] text-3xl mr-2">
                        <FiGift />
                    </span>
                    <h2 className="text-2xl font-bold">Subscribe Now</h2>
                </div>

            </div>
            <div className="flex justify-center rounded-lg ">

                <div className={` w-full mx-auto grid grid-flow-col auto-cols-[80%] sm:auto-cols-[45%] lg:auto-cols-[20%] gap-4 lg:gap-30 p-4 lg:justify-center overflow-x-scroll hide-scrollbar`}>
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
                            <div className='relative px-4 overflow-y-visible z-1 pb-3'>
                                <h1 className="text-xl md:text-xl font-bold text-left pt-6 bg-gradient-to-r from-[#e50914] to-[#db0000] text-[#e50914] bg-clip-text group-hover:bg-none transition-colors duration-300">{packageItem.name}</h1>
                                <div className="flex items-baseline gap-0 justify-start py-4 transition-colors duration-300">
                                    <h1 className="text-5xl text-white font-bold group-hover:text-black transition-colors duration-300">
                                        ${packageItem.price.toFixed(2)}
                                    </h1>
                                    <h4 className="text-xs md:text-xs text-white group-hover:text-black transition-colors duration-300 whitespace-nowrap">
                                        / month
                                    </h4>
                                </div>

                                <ul className="text-xs md:text-sm text-gray-400  group-hover:text-black transition-colors duration-300 text-left">
                                    {packageItem.features.map((feature, idx) => (
                                        <li key={idx} className="flex  ml-2 mb-1">
                                            <FiCheck className=" mr-2 mt-1 group-hover:text-[#e50914] transition-colors duration-300" />
                                            {feature}
                                        </li>
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

