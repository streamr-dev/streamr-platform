// @flow

export const ErrorCodes = {
    WEB3_NOT_SUPPORTED: 'WEB3/NOT_SUPPORTED',
    WEB3_NOT_ENABLED: 'WEB3/NOT_ENABLED',
    WALLET_LOCKED: 'WEB3/WALLET_LOCKED',
    WRONG_NETWORK_SELECTED: 'WEB3/WRONG_NETWORK_SELECTED',
    CHALLENGE_FAILED: 'WEB3/CHALLENGE_FAILED',
}

export class Web3NotSupportedError extends Error {
    code: string

    constructor(message: string = 'Web3 not supported', ...args: any[]) {
        super(message, ...args)

        this.code = ErrorCodes.WEB3_NOT_SUPPORTED

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, Web3NotSupportedError)
        }

        // This is because of some bug in babel (https://github.com/babel/babel/issues/4485)
        Object.setPrototypeOf(this, Web3NotSupportedError.prototype)
    }
}

export class Web3NotEnabledError extends Error {
    code: string

    constructor(message: string = 'Please unlock your wallet or enable access to your account', ...args: any[]) {
        super(message, ...args)

        this.code = ErrorCodes.WEB3_NOT_ENABLED

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, Web3NotEnabledError)
        }

        Object.setPrototypeOf(this, Web3NotEnabledError.prototype)
    }
}

export class WalletLockedError extends Error {
    code: string

    constructor(message: string = 'Please unlock your wallet', ...args: any[]) {
        super(message, ...args)

        this.code = ErrorCodes.WALLET_LOCKED

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, Web3NotEnabledError)
        }

        Object.setPrototypeOf(this, WalletLockedError.prototype)
    }
}

export class WrongNetworkSelectedError extends Error {
    code: string

    constructor(requiredNetworkName: string, currentNetworkName: string, ...args: any[]) {
        super(
            `Please switch to the ${requiredNetworkName} network in your Ethereum wallet. It's currently ${currentNetworkName}.`,
            ...args,
        )

        this.code = ErrorCodes.WRONG_NETWORK_SELECTED

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, WrongNetworkSelectedError)
        }

        Object.setPrototypeOf(this, WrongNetworkSelectedError.prototype)
    }
}

export class ChallengeFailedError extends Error {
    code: string

    constructor(message: string = 'Challenge failed', ...args: any[]) {
        super(message, ...args)

        this.code = ErrorCodes.CHALLENGE_FAILED

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ChallengeFailedError)
        }

        Object.setPrototypeOf(this, ChallengeFailedError.prototype)
    }
}

export default {
    Web3NotSupportedError,
    Web3NotEnabledError,
    WalletLockedError,
    WrongNetworkSelectedError,
    ChallengeFailedError,
}
