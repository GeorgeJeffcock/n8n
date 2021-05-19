import {
    ICredentialType,
    NodePropertyTypes,
} from 'n8n-workflow';

export class IbmiJdbc implements ICredentialType {
    name = 'ibmiJdbc';
    displayName = 'IBM i Toolbox for Java JDBC properties';
    documentationUrl = 'https://www.ibm.com/docs/en/i/7.4?topic=ssw_ibm_i_74/rzahh/javadoc/com/ibm/as400/access/doc-files/JDBCProperties.html';
	properties = [
		{
			displayName: 'Host',
			name: 'host',
			type: 'string' as NodePropertyTypes,
			required: true,
			default: 'pub400.com',
			description: 'Specify the TCP/IP host name or TCP/IP address of the database server',
		},
		{
			displayName: 'User',
			name: 'user',
			type: 'string' as NodePropertyTypes,
			required: true,
			default: 'LOWCODE',
			description: 'Specifies the user name for connecting to the system',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string' as NodePropertyTypes,
			typeOptions: {
				password: true,
			},
			required: true,
			default: 'GEORGE02',
			description: 'Specifies the password for connecting to the system',
		},
/*
		{
			displayName: 'Port',
			name: 'port',
			type: 'number' as NodePropertyTypes,
			default: 3306,
		},
		{
			displayName: 'Connect Timeout',
			name: 'connectTimeout',
			type: 'number' as NodePropertyTypes,
			default: 10000,
			description: 'The milliseconds before a timeout occurs during the initial connection to the MySQL server.',
		},
		{
			displayName: 'SSL',
			name: 'ssl',
			type: 'boolean' as NodePropertyTypes,
			default: false,
		},
		{
			displayName: 'CA Certificate',
			name: 'caCertificate',
			typeOptions: {
				alwaysOpenEditWindow: true,
				password: true,
			},
			displayOptions: {
				show: {
					ssl: [
						true,
					],
				},
			},
			type: 'string' as NodePropertyTypes,
			default: '',
		},
		{
			displayName: 'Client Private Key',
			name: 'clientPrivateKey',
			typeOptions: {
				alwaysOpenEditWindow: true,
				password: true,
			},
			displayOptions: {
				show: {
					ssl: [
						true,
					],
				},
			},
			type: 'string' as NodePropertyTypes,
			default: '',
		},
		{
			displayName: 'Client Certificate',
			name: 'clientCertificate',
			typeOptions: {
				alwaysOpenEditWindow: true,
				password: true,
			},
			displayOptions: {
				show: {
					ssl: [
						true,
					],
				},
			},
			type: 'string' as NodePropertyTypes,
			default: '',
		},
*/
	];
}