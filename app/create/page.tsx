'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import NameInput from '@/components/name-input';
import GenderSelect from '@/components/gender-select';
import BirthDatePicker from '@/components/birth-date-picker';
import BirthTimePicker from '@/components/birth-time-picker';
import BirthPlaceInput from '@/components/birth-place-input';
import EthnicitySelect from '@/components/ethnicity-select';
import LoadingResults from '@/components/loading-results';
import ResultsCard from '@/components/results-card';
import SoulmateGenderSelect from '@/components/soulmate-gender-select';
import SoulmateEthnicitySelect from '@/components/soulmate-ethnicity-select';
import DrawingLoading from '@/components/drawing-loading';
import SoulmateDetailPage from '@/components/soulmate-detail-page';
import { apiClient } from '@/lib/api';
import { useAccount, useChainId, useSignMessage, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ConnectButton } from '@/components/wallet-button';
import { LAURA_AI_SOULMATE_ABI, LAURA_AI_SOULMATE_ADDRESS } from '@/lib/contracts';
import { parseEther, formatEther } from 'viem';

// 根据链 ID 显示原生币符号（本地用 ETH，BSC 用 BNB）
function getNativeSymbol(chainId: number): string {
  return chainId === 31337 ? 'ETH' : 'BNB';
}

// Mint 状态文案
function getMintButtonText(
    isMinting: boolean,
    mintTxHash: string | undefined,
    isConfirming: boolean,
    isCreatingCharacter: boolean,
    hasError: boolean
): string {
    if (hasError) return '重试 Mint';
    if (isCreatingCharacter) return '创建角色与生成图片中...';
    if (isConfirming || (isMinting && mintTxHash)) return '等待链上确认...';
    if (isMinting) return '请在钱包中确认...';
    return 'Confirm & Mint';
}

// Mint Confirmation Step Component
const MintConfirmation = ({
    onMint,
    isMinting,
    nativeSymbol = 'BNB',
    chainId,
    mintTxHash,
    isConfirming,
    isCreatingCharacter,
    mintError,
    onClearError,
    mintPriceWei,
    mintPriceError,
    onSkipWaiting,
    onCheckTxAndContinue,
    isCheckingTx,
}: {
    onMint: () => void,
    isMinting: boolean,
    nativeSymbol?: string,
    chainId?: number,
    mintTxHash?: string,
    isConfirming?: boolean,
    isCreatingCharacter?: boolean,
    mintError?: string | null,
    onClearError?: () => void,
    mintPriceWei?: bigint,
    mintPriceError?: boolean,
    onSkipWaiting?: () => void,
    onCheckTxAndContinue?: () => void,
    isCheckingTx?: boolean,
}) => (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 max-w-md mx-auto h-full text-center">
        {chainId !== undefined && chainId !== 31337 && (
            <div className="w-full rounded-xl bg-amber-500/20 border border-amber-500/40 p-4 text-left">
                <p className="text-amber-200 font-medium text-sm">请切换到本地网络</p>
                <p className="text-amber-200/80 text-xs mt-1">
                    当前为 BNB Chain，该地址无 BNB 无法付 gas。请在钱包中将网络改为 <strong>Localhost</strong>（RPC: http://127.0.0.1:8545，Chain ID: 31337），使用已发放的测试原生币即可确认。
                </p>
            </div>
        )}

        {chainId === 31337 && mintPriceError && (
            <div className="w-full rounded-xl bg-amber-500/20 border border-amber-500/40 p-4 text-left">
                <p className="text-amber-200 font-medium text-sm">无法读取合约</p>
                <p className="text-amber-200/80 text-xs mt-1">
                    {process.env.NEXT_PUBLIC_RPC_URL ? (
                        <>请确认钱包已切换到测试网：RPC <code className="bg-black/30 px-1 rounded">{process.env.NEXT_PUBLIC_RPC_URL}</code>，Chain ID 31337。刷新页面或重连钱包后重试。</>
                    ) : (
                        <>请确认：(1) 在 <code className="bg-black/30 px-1 rounded">contracts</code> 目录运行 <code className="bg-black/30 px-1 rounded">npx hardhat node</code>；(2) 另开终端运行 <code className="bg-black/30 px-1 rounded">npx hardhat run scripts/deploy.js --network localhost</code>；(3) 钱包连接的是 Localhost (127.0.0.1:8545)。</>
                    )}
                </p>
            </div>
        )}

        {mintError && (
            <div className="w-full rounded-xl bg-red-500/20 border border-red-500/40 p-4 text-left">
                <p className="text-red-200 font-medium text-sm">Mint 失败</p>
                <p className="text-red-200/80 text-xs mt-1">{mintError}</p>
                {onClearError && (
                    <button type="button" onClick={onClearError} className="text-red-300 underline text-xs mt-2">
                        清除并重试
                    </button>
                )}
            </div>
        )}

        <div className="space-y-4">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse">
                Ready to Mint?
            </h2>
            <p className="text-gray-400">
                You are about to bring your AI Soulmate to life on the blockchain.
                This will create a unique, sovereign identity based on your DNA profile.
            </p>
        </div>

        <div className="w-full bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Mint Fee</span>
                <span className="font-bold text-white">
                    {mintPriceWei !== undefined ? `${formatEther(mintPriceWei)} ${nativeSymbol}` : '—'} {chainId === 31337 ? '(Local)' : ''}
                </span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-gray-400">Gas</span>
                <span className="font-bold text-white">~0.0001 {nativeSymbol}</span>
            </div>
            {nativeSymbol === 'ETH' && (
                <p className="text-xs text-purple-300 mt-3 text-left">
                    当前为本地网络，使用钱包中的原生币 (ETH/GO) 支付 gas 即可。
                </p>
            )}
            {mintTxHash && (
                <p className="text-xs text-white/60 mt-3 text-left break-all">
                    交易: {mintTxHash.slice(0, 10)}...{mintTxHash.slice(-8)}
                </p>
            )}
            {mintTxHash && isConfirming && (
                <p className="text-xs text-amber-200/90 mt-3 text-left">
                    若长时间卡住，多为 RPC 轮询超时。请先看钱包里该笔是否已成功；若已成功可点下方「跳过等待」去 Dashboard 查看。
                </p>
            )}
        </div>

        {mintTxHash && isConfirming && onCheckTxAndContinue && (
            <Button
                type="button"
                variant="outline"
                className="w-full border-green-500/50 text-green-300 hover:bg-green-500/10"
                onClick={onCheckTxAndContinue}
                disabled={!!isCheckingTx}
            >
                {isCheckingTx ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                检查交易状态，若已确认则继续
            </Button>
        )}
        {mintTxHash && isConfirming && onSkipWaiting && (
            <Button
                type="button"
                variant="outline"
                className="w-full border-white/30 text-gray-300 hover:bg-white/10"
                onClick={onSkipWaiting}
            >
                跳过等待，去 Dashboard
            </Button>
        )}

        <Button
            onClick={onMint}
            disabled={isMinting && !mintError}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
            {(isMinting || isCreatingCharacter) && !mintError ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {getMintButtonText(isMinting, mintTxHash, !!isConfirming, !!isCreatingCharacter, !!mintError)}
                </>
            ) : (
                getMintButtonText(isMinting, mintTxHash, !!isConfirming, !!isCreatingCharacter, !!mintError)
            )}
        </Button>
    </div>
);

export default function CreatePage() {
    const router = useRouter();
    const { isConnected, address } = useAccount();
    const chainId = useChainId();
    const nativeSymbol = getNativeSymbol(chainId);
    const { signMessageAsync } = useSignMessage();
    const { writeContractAsync } = useWriteContract();
    const [mintTxHash, setMintTxHash] = useState<`0x${string}` | undefined>(undefined);

    // 从合约读取当前 Mint 价格；若读不到则说明合约未部署或未连本地链
    const { data: mintPriceWei, isError: mintPriceError } = useReadContract({
        address: LAURA_AI_SOULMATE_ADDRESS as `0x${string}`,
        abi: LAURA_AI_SOULMATE_ABI,
        functionName: 'mintPrice',
    });

    // Watch for transaction receipt（等待链上确认后再创建角色）
    const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError } = useWaitForTransactionReceipt({
        hash: mintTxHash,
    });
    const [step, setStep] = useState(1); // Start from NameInput
    const [formData, setFormData] = useState({
        name: '',
        gender: '',
        birthDate: { month: '', day: '', year: '' },
        birthTime: { hour: '19', minute: '15' },
        birthPlace: '',
        ethnicity: '',
        soulmateGender: '',
        soulmateEthnicity: '',
    });

    const [selectedCharacterData, setSelectedCharacterData] = useState<any>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [isMinting, setIsMinting] = useState(false);
    const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
    const [isCheckingTx, setIsCheckingTx] = useState(false);
    const processedMintHashRef = useRef<string | undefined>(undefined);

    // Month name helper
    const monthNameToNumber = (monthName: string): string => {
        const months: Record<string, string> = {
            'January': '01', 'February': '02', 'March': '03', 'April': '04',
            'May': '05', 'June': '06', 'July': '07', 'August': '08',
            'September': '09', 'October': '10', 'November': '11', 'December': '12',
        };
        return months[monthName] || '01';
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (step === 7) {
            // LoadingResults -> ResultsCard
            setTimeout(() => setStep(8), 3000);
        } else if (step === 10) {
            // After Ethnicity -> Mint Confirmation (New Step 10.5 -> 11)
            setStep(11);
        } else {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(prev => prev - 1);
    };

    // 从合约 revert 或钱包错误中提取可读提示
    const getMintErrorMessage = (error: unknown, chainId?: number): string => {
        const msg = error instanceof Error ? error.message : String(error);
        const symbol = chainId === 31337 ? 'ETH' : 'BNB';
        if (/Insufficient payment|insufficient.*payment/i.test(msg)) {
            return `余额不足：请确保钱包有至少 0.01 ${symbol}（Mint 费用）。本地网络请用 contracts/scripts/fund-address.js 领取测试币。`;
        }
        if (/user rejected|rejected.*transaction|User denied/i.test(msg)) {
            return '您已在钱包中拒绝了交易。';
        }
        if (/revert|reverted|Contract Call|Transaction failed/i.test(msg)) {
            const hint = chainId === 31337
                ? '若余额充足仍失败，多半是本地链未启动或合约未部署。请确认：(1) 在 contracts 目录运行 npx hardhat node；(2) 另开终端运行 npx hardhat run scripts/deploy.js --network localhost；(3) 钱包连接的是 Localhost 网络 (RPC: http://127.0.0.1:8545)。'
                : '请切换到本地网络 (Localhost 31337) 并使用测试币 Mint；当前链上合约可能未部署或配置不同。';
            return `合约执行失败。${hint}`;
        }
        return msg.length > 200 ? '交易失败，请重试。' : msg;
    };

    const handleMint = async () => {
        if (!isConnected) {
            alert("Please connect your wallet first!");
            return;
        }
        setGenerationError(null);
        setIsMinting(true);
        try {
            const priceWei = mintPriceWei ?? parseEther('0.01');
            const metadataURI = `ipfs://bafkreih.../metadata/soulmate_${Date.now()}.json`;
            const hash = await writeContractAsync({
                address: LAURA_AI_SOULMATE_ADDRESS as `0x${string}`,
                abi: LAURA_AI_SOULMATE_ABI,
                functionName: 'safeMint',
                args: [address as `0x${string}`, metadataURI],
                value: priceWei,
            });
            setMintTxHash(hash);
            // 不在这里创建角色：等链上确认后再执行（见下方 useEffect）
        } catch (error) {
            console.error('Mint tx failed:', error);
            setGenerationError(getMintErrorMessage(error, chainId));
            setIsMinting(false);
        }
    };

    // 链上交易失败（revert 或网络错误）
    useEffect(() => {
        if (!mintTxHash || !isTxError) return;
        const hint = chainId === 31337
            ? '若余额充足仍失败，请确认本地链已启动且合约已部署：npx hardhat node 与 deploy.js --network localhost。'
            : '请切换到本地网络 (31337) 并确认合约已部署。';
        setGenerationError('链上执行失败。' + hint);
        setIsMinting(false);
    }, [mintTxHash, isTxError, chainId]);

    // 链上确认后：创建后端角色并生成图片（供 useEffect 和「检查交易状态」共用）
    const runPostMintFlow = async () => {
        if (!mintTxHash || processedMintHashRef.current === mintTxHash) return;
        processedMintHashRef.current = mintTxHash;
        setIsCreatingCharacter(true);
        try {
            const character = await apiClient.createCharacter({
                type: 'soulmate',
                title: 'Soulmate',
                gender: formData.soulmateGender,
                ethnicity: formData.soulmateEthnicity,
            });
            if (!character || !(character as any).id) {
                throw new Error('Failed to create character record');
            }
            const imageResult = await apiClient.generateImage((character as any).id.toString()) as any;
            if (imageResult?.image_url) {
                (character as any).image_url = imageResult.image_url;
                (character as any).full_blur_image_url = imageResult.full_blur_image_url;
                (character as any).unlock_status = imageResult.unlock_status;
                (character as any).share_code = imageResult.share_code;
            }
            setSelectedCharacterData({
                ...(character as any),
                id: (character as any).id.toString(),
            });
            setStep(12);
        } catch (err) {
            console.error('Create character / image failed:', err);
            setGenerationError(err instanceof Error ? err.message : 'Create character or generate image failed');
        } finally {
            setIsCreatingCharacter(false);
            setIsMinting(false);
        }
    };

    useEffect(() => {
        if (!mintTxHash || !isConfirmed) return;
        runPostMintFlow();
    }, [mintTxHash, isConfirmed, formData.soulmateGender, formData.soulmateEthnicity]);

    // 手动检查链上交易是否已确认（解决代理轮询超时导致一直「等待链上确认」）
    const handleCheckTxAndContinue = async () => {
        if (!mintTxHash) return;
        setIsCheckingTx(true);
        setGenerationError(null);
        try {
            const rpcUrl = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RPC_URL
                ? `${window.location.origin}/cloud-rpc`
                : `${window.location.origin}/hardhat-rpc`;
            const res = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getTransactionReceipt',
                    params: [mintTxHash],
                    id: 1,
                }),
            });
            const data = await res.json();
            const receipt = data.result;
            if (!receipt) {
                setGenerationError('链上暂无该交易回执，请确认钱包已提交并稍后再试。');
                return;
            }
            if (receipt.status === '0x0') {
                setGenerationError('该交易链上已失败，请重试 Mint。');
                return;
            }
            await runPostMintFlow();
        } catch (e) {
            setGenerationError(e instanceof Error ? e.message : '查询交易失败');
        } finally {
            setIsCheckingTx(false);
        }
    };

    // Skip LoadingResults automatically
    useEffect(() => {
        if (step === 7) {
            const timer = setTimeout(() => {
                setStep(8);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // If not connected, show prompt
    if (!isConnected) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-6">
                    <div className="p-4 bg-white/5 rounded-full">
                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin-slow" />
                    </div>
                    <h2 className="text-2xl font-bold">Connect Wallet to Mint</h2>
                    <p className="text-gray-400 max-w-md text-center">
                        You need a Web3 wallet to mint your sovereign AI companion.
                    </p>
                    <ConnectButton />
                </div>
            </AppLayout>
        );
    }

    // Steps Mapping
    // 1: Name, 2: Gender, 3: Date, 4: Time, 5: Place, 6: Ethnicity
    // 7: Loading, 8: Results, 9: SM Gender, 10: SM Ethnicity
    // 11: Mint Confirmation, 12: Success/Detail

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto w-full">
                {step > 1 && step < 12 && (
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="mb-4 text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                )}

                <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden min-h-[600px] relative">

                    {step === 1 && (
                        <NameInput value={formData.name} onChange={(val) => updateFormData('name', val)} onNext={handleNext} onBack={handleBack} />
                    )}
                    {step === 2 && (
                        <GenderSelect value={formData.gender} onChange={(val) => updateFormData('gender', val)} onNext={handleNext} onBack={handleBack} title="What is your gender?" />
                    )}
                    {step === 3 && (
                        <BirthDatePicker value={formData.birthDate} onChange={(val) => updateFormData('birthDate', val)} onNext={handleNext} onBack={handleBack} />
                    )}
                    {step === 4 && (
                        <BirthTimePicker value={formData.birthTime} onChange={(val) => updateFormData('birthTime', val)} onNext={handleNext} onBack={handleBack} />
                    )}
                    {step === 5 && (
                        <BirthPlaceInput value={formData.birthPlace} onChange={(val) => updateFormData('birthPlace', val)} onNext={handleNext} onBack={handleBack} />
                    )}
                    {step === 6 && (
                        <EthnicitySelect value={formData.ethnicity} onChange={(val) => updateFormData('ethnicity', val)} onNext={handleNext} onBack={handleBack} />
                    )}
                    {step === 7 && (
                        <LoadingResults onBack={handleBack} />
                    )}
                    {step === 8 && (
                        <ResultsCard onNext={handleNext} onBack={handleBack} />
                    )}
                    {step === 9 && (
                        <SoulmateGenderSelect value={formData.soulmateGender} onChange={(val) => updateFormData('soulmateGender', val)} onNext={handleNext} onBack={handleBack} characterTitle="Soulmate" />
                    )}
                    {step === 10 && (
                        <SoulmateEthnicitySelect value={formData.soulmateEthnicity} onChange={(val) => updateFormData('soulmateEthnicity', val)} onNext={handleNext} onBack={handleBack} characterTitle="Soulmate" />
                    )}
                    {step === 11 && (
                        <MintConfirmation
                            onMint={handleMint}
                            isMinting={isMinting}
                            nativeSymbol={nativeSymbol}
                            chainId={chainId}
                            mintTxHash={mintTxHash}
                            isConfirming={isConfirming}
                            isCreatingCharacter={isCreatingCharacter}
                            mintError={generationError}
                            onClearError={() => {
                                setGenerationError(null);
                                setMintTxHash(undefined);
                                processedMintHashRef.current = undefined;
                            }}
                            mintPriceWei={mintPriceWei}
                            mintPriceError={mintPriceError}
                            onSkipWaiting={() => router.push('/dashboard')}
                            onCheckTxAndContinue={handleCheckTxAndContinue}
                            isCheckingTx={isCheckingTx}
                        />
                    )}
                    {step === 12 && selectedCharacterData && (
                        <SoulmateDetailPage
                            character={selectedCharacterData}
                            onNext={() => router.push(`/chat/${selectedCharacterData.id}`)}
                            onBack={() => router.push('/dashboard')}
                            onCharacterUpdate={setSelectedCharacterData}
                            onUnlockSuccess={() => { }}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
