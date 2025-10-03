"use client";
import React from 'react';
import { FiGift, FiCheck } from "react-icons/fi";
import { useTranslation } from 'react-i18next';

const SubscriptionSection: React.FC = () => {
    const { t } = useTranslation('common');

    // Load translated package objects. returnObjects enables returning arrays/objects from translations
    const platinum = t('subscription.platinum', { returnObjects: true }) as any;
    const diamond = t('subscription.diamond', { returnObjects: true }) as any;
    const supreme = t('subscription.supreme_family', { returnObjects: true }) as any;

    const packages = [
        { id: 'platinum', ...platinum },
        { id: 'diamond', ...diamond },
        { id: 'supreme_family', ...supreme }
    ];

    return (
        <div className="container mx-auto px-4 py-8 ">
            <div className="flex items-center lg:justify-center mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-[#fbb033] text-3xl mr-2">
                        <FiGift />
                    </span>
                    <h2 className="text-2xl font-bold">{t('subscription.plans')}</h2>
                </div>

            </div>
            <div className="flex justify-center rounded-lg ">

                <div className={` w-full mx-auto grid grid-flow-col auto-cols-[80%] sm:auto-cols-[45%] lg:auto-cols-[20%] gap-4 lg:gap-30 p-4 lg:justify-center overflow-x-scroll hide-scrollbar`}>
                    {packages.map((packageItem: any) => (
                        <div
                            key={packageItem.id}
                            className={`flex flex-1 flex-col bg-black shadow-[0px_0px_2px_1px] pb-2 shadow-[#fbb033] rounded-lg touchable hover:scale-105 transition-transform duration-300 cursor-pointer group hover:bg-white/90`}
                        >
                            <div className="relative w-full h-auto rounded-lg mb-2">
                                {/* image slot (optional) */}
                            </div>
                            <div className='relative px-4 overflow-y-visible z-1 pb-3'>
                                <h1 className="text-xl md:text-xl font-bold text-left pt-6 bg-gradient-to-r from-[#fbb033] to-[#db0000] text-[#fbb033] bg-clip-text group-hover:bg-none transition-colors duration-300">{packageItem.title}</h1>
                                <div className="flex items-baseline gap-0 justify-start py-4 transition-colors duration-300">
                                    <h1 className="text-2xl md:text-4xl text-white font-bold group-hover:text-black transition-colors duration-300">
                                        {packageItem.price}
                                    </h1>
                                </div>

                                <ul className="text-xs md:text-sm text-gray-400  group-hover:text-black transition-colors duration-300 text-left">
                                    {(packageItem.features || []).map((feature: string, idx: number) => (
                                        <li key={idx} className="flex  ml-2 mb-1">
                                            <FiCheck className=" mr-2 mt-1 group-hover:text-[#fbb033] transition-colors duration-300" />
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

