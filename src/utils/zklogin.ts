import { computeZkLoginAddress } from "@mysten/sui/zklogin";
import { parseJWT } from "./jwt";

export function jwtToAddress(jwt: string, userSalt: string | bigint, legacyAddress: boolean) : any {
	// Explicitly check for people not using typescript and ignoring the major version migration guide
	if (legacyAddress === undefined) {
		throw new Error('legacyAddress parameter must be specified');
	}
	// lengthChecks(jwt);

	const decodedJWT = parseJWT(jwt);

	return computeZkLoginAddress({
		userSalt,
		claimName: 'sub',
		claimValue: decodedJWT.sub,
		aud: decodedJWT.aud,
		iss: decodedJWT.iss,
		legacyAddress,
	});
}