"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { getBanks, verifyBankAccount, createTransferRecipient } from "@/lib/paystack-service"

interface BankAccountVerificationProps {
  onSuccess: (data: {
    accountName: string
    accountNumber: string
    bankName: string
    bankCode: string
    recipientCode: string
  }) => void
  className?: string
}

export default function BankAccountVerification({ onSuccess, className = "" }: BankAccountVerificationProps) {
  const [banks, setBanks] = useState<Array<{ id: number; name: string; code: string; country: string }>>([])
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [accountNumber, setAccountNumber] = useState<string>("")
  const [accountName, setAccountName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Load banks on component mount
  useEffect(() => {
    const loadBanks = async () => {
      setIsLoading(true)
      try {
        const banksList = await getBanks()
        setBanks(banksList)
      } catch (error) {
        console.error("Error loading banks:", error)
        toast({
          title: "Error",
          description: "Failed to load banks. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadBanks()
  }, [toast])

  // Handle bank selection
  const handleBankChange = (value: string) => {
    setSelectedBank(value)
    setIsVerified(false)
    setAccountName("")
  }

  // Handle account number change
  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountNumber(e.target.value)
    setIsVerified(false)
    setAccountName("")
  }

  // Verify bank account
  const handleVerify = async () => {
    if (!selectedBank || !accountNumber || accountNumber.length < 10) {
      toast({
        title: "Validation Error",
        description: "Please select a bank and enter a valid account number.",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    try {
      const result = await verifyBankAccount(accountNumber, selectedBank)
      setAccountName(result.accountName)
      setIsVerified(true)
      toast({
        title: "Account Verified",
        description: `Account verified: ${result.accountName}`,
      })
    } catch (error) {
      console.error("Error verifying account:", error)
      toast({
        title: "Verification Failed",
        description: "Could not verify account. Please check the details and try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  // Save bank details
  const handleSave = async () => {
    if (!isVerified || !user) {
      return
    }

    setIsLoading(true)
    try {
      // Create transfer recipient
      const bankDetails = {
        accountNumber,
        bankCode: selectedBank,
        accountName,
      }

      const result = await createTransferRecipient(user, bankDetails)

      // Call onSuccess with the bank details and recipient code
      onSuccess({
        accountName,
        accountNumber,
        bankName: banks.find((bank) => bank.code === selectedBank)?.name || "",
        bankCode: selectedBank,
        recipientCode: result.recipientCode,
      })

      toast({
        title: "Bank Details Saved",
        description: "Your bank account has been verified and saved successfully.",
      })
    } catch (error) {
      console.error("Error saving bank details:", error)
      toast({
        title: "Error",
        description: "Failed to save bank details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bank Account Verification</CardTitle>
        <CardDescription>Verify your bank account to receive payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bank">Bank</Label>
          <Select value={selectedBank} onValueChange={handleBankChange} disabled={isLoading || isVerifying}>
            <SelectTrigger id="bank">
              <SelectValue placeholder="Select your bank" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank.code} value={bank.code}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            value={accountNumber}
            onChange={handleAccountNumberChange}
            placeholder="Enter your account number"
            disabled={isLoading || isVerifying}
          />
        </div>

        {accountName && (
          <div className="p-3 bg-green-50 dark:bg-green-900 rounded-md">
            <p className="text-green-700 dark:text-green-300 font-medium">Account Name: {accountName}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {!isVerified ? (
          <Button
            onClick={handleVerify}
            disabled={isLoading || isVerifying || !selectedBank || !accountNumber}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Account"
            )}
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Bank Details"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

