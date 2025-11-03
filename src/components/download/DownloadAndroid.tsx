'use client';

import { useTranslation } from "react-i18next";
import Image from "next/image";

export default function ProfileEmpty() {
    const { t } = useTranslation('common');

    const googlePlayUrl = "https://play.google.com/store/apps/details?id=com.otalk.im";
    const downloadUrl = "https://social.otalk.tv/download/otalk-v1.0.7.apk?v1.0.7";
    const googleImage = "/images/download/google_play_otalk_im.png";
    const downloadImage = "/images/download/android_app_v1.0.7.png";

    return (
        <div className="w-full mt-16">
            <div className="grid grid-cols-2 gap-4 text-center max-w-2xl mx-auto">
                <div className="" style={{ background: "rgba(0, 0, 0, 0.3)", padding: "16px 0" }}>
                    {/* <div>{t('profileEmpty.googlePlay', 'googlePlay')}</div> */}
                    <div className="text-center">
                        <Image
                            src={googleImage}
                            alt={'google_play'}
                            width={`${110}`}
                            height={`${110}`}
                            className="mt-4 mx-auto"
                            onLoad={() => {}}
                        />
                    </div>
                    <div className="mt-4">
                        <a 
                            target="_blank"
                            className="mt-1 px-4 py-2 bg-[#333] text-white rounded-md hover:bg-[#fbb033] disabled:bg-gray-400 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                            href={googlePlayUrl}
                            style={{ display: "inline-block" }}
                        >
                            <span className="flex text-center items-align">
                                <span>
                                    <svg className="w-5 h-5" aria-hidden="true" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0,0h40v40H0V0z"></path><g><path d="M19.7,19.2L4.3,35.3c0,0,0,0,0,0c0.5,1.7,2.1,3,4,3c0.8,0,1.5-0.2,2.1-0.6l0,0l17.4-9.9L19.7,19.2z" fill="#EA4335"></path><path d="M35.3,16.4L35.3,16.4l-7.5-4.3l-8.4,7.4l8.5,8.3l7.5-4.2c1.3-0.7,2.2-2.1,2.2-3.6C37.5,18.5,36.6,17.1,35.3,16.4z" fill="#FBBC04"></path><path d="M4.3,4.7C4.2,5,4.2,5.4,4.2,5.8v28.5c0,0.4,0,0.7,0.1,1.1l16-15.7L4.3,4.7z" fill="#4285F4"></path><path d="M19.8,20l8-7.9L10.5,2.3C9.9,1.9,9.1,1.7,8.3,1.7c-1.9,0-3.6,1.3-4,3c0,0,0,0,0,0L19.8,20z" fill="#34A853"></path></g></svg>
                                </span>
                                <span style={{ fontFamily: "Google Sans, Roboto, Arial, sans-serif", fontWeight: 600, marginLeft: '5px' }}>
                                    Google Play
                                </span>
                            </span>
                        </a>
                    </div>
                </div>
                <div className="" style={{ background: "rgba(0, 0, 0, 0.3)", padding: "16px 0" }}>
                    {/* <div>{t('profileEmpty.androidApk', 'Android App')}</div> */}
                    <div className="text-center">
                        <Image
                            src={downloadImage}
                            alt={'android_app'}
                            width={`${110}`}
                            height={`${110}`}
                            className="mt-4 mx-auto"
                            onLoad={() => {}}
                        />
                    </div>
                    <div className="mt-4 mx-auto">
                        <a 
                            target="_blank"
                            className="mt-1 px-4 py-2 bg-[#333] text-white rounded-md hover:bg-[#fbb033] disabled:bg-gray-400 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                            href={downloadUrl}
                            style={{ display: "inline-block" }}
                        >
                            <span className="flex text-center items-align">
                                <span>
                                    <svg className="w-5 h-5" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1683" width="64" height="64"><path d="M820.409449 797.228346q0 25.19685-10.07874 46.866142t-27.716535 38.299213-41.322835 26.204724-50.897638 9.574803l-357.795276 0q-27.212598 0-50.897638-9.574803t-41.322835-26.204724-27.716535-38.299213-10.07874-46.866142l0-675.275591q0-25.19685 10.07874-47.370079t27.716535-38.80315 41.322835-26.204724 50.897638-9.574803l357.795276 0q27.212598 0 50.897638 9.574803t41.322835 26.204724 27.716535 38.80315 10.07874 47.370079l0 675.275591zM738.771654 170.330709l-455.559055 0 0 577.511811 455.559055 0 0-577.511811zM510.992126 776.062992q-21.165354 0-36.787402 15.11811t-15.622047 37.291339q0 21.165354 15.622047 36.787402t36.787402 15.622047q22.173228 0 37.291339-15.622047t15.11811-36.787402q0-22.173228-15.11811-37.291339t-37.291339-15.11811zM591.622047 84.661417q0-8.062992-5.03937-12.598425t-11.086614-4.535433l-128 0q-5.03937 0-10.582677 4.535433t-5.543307 12.598425 5.03937 12.598425 11.086614 4.535433l128 0q6.047244 0 11.086614-4.535433t5.03937-12.598425z" p-id="1684" fill="#ffffff"></path></svg>
                                </span>
                                <span style={{ fontFamily: "Google Sans, Roboto, Arial, sans-serif", fontWeight: 600, marginLeft: '5px' }}>
                                    <div>{t('profileEmpty.apkDownload', 'Download Apk')}</div>
                                </span>
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

