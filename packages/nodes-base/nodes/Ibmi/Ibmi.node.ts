/*************************************************************************************************************
SCRIPT DATE 05/May/2021
AUTHOR: George Jeffcock
HELP URL: 
DESCRIPTION: Expose IBM i (aka AS/400) to n8n.io
*************************************************************************************************************/

// Dependent on https://www.npmjs.com/package/node-jt400
import * as jt400 from 'node-jt400';

import {
    IExecuteFunctions,
} from 'n8n-core';

import {
    IDataObject,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';

import {
    chunk,
    flatten,
} from '../utils/utilities';

import {
    ITables,
} from './TableInterface';

import {
    copyInputItem,
    createTableStruct,
    executeQueryQueue,
    extractDeleteValues,
    extractUpdateCondition,
    extractUpdateSet,
    extractValues,
} from './GenericFunctions';

export class Ibmi implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'IBM i JTOpen (aka AS400)',
        name: 'ibmi',
        icon: 'file:ibmi.png',
        group: ['transform'],
        version: 1,
        description: 'Get, add, update, delete IBM i DB2 data using IBM Toolbox for Java',
        defaults: {
            name: 'IBM i JTOpen',
            color: '#006699',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'ibmiJdbc',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                options: [
                    {
                        name: 'Execute Query',
                        value: 'executeQuery',
                        description: 'Execute a DB2 SQL query for IBM i',
                    },
                    {
                        name: 'Insert List',
                        value: 'insert',
                        description: 'Insert record(s) into DB2 for IBM i',
                    },
                    /*
                    {
                        name: 'Update',
                        value: 'update',
                        description: 'Update rows in database',
                    },
                    {
                        name: 'Delete',
                        value: 'delete',
                        description: 'Delete rows in database',
                    },
                    */
                ],
                default: 'executeQuery',
                description: 'The operation to perform.',
            },

            // ----------------------------------
            //         executeQuery
            // ----------------------------------
            {
                displayName: 'Query',
                name: 'query',
                type: 'string',
                typeOptions: {
                    rows: 5, // rows [type: string]: Number of rows the input field should have. By default it is "1"
                },
                displayOptions: {
                    show: {
                        operation: ['executeQuery'],
                    },
                },
                default: 'SELECT FNAME FROM LOWCODE1.PTBL LIMIT 2',
                placeholder: 'SELECT FNAME FROM LOWCODE1.PTBL LIMIT 2',
                required: true,
                description: 'The SQL query to execute.',
            },

            // ----------------------------------
            //         insert
            // ----------------------------------
            {
                displayName: 'Table',
                name: 'table',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['insert'],
                    },
                },
                default: '',
                required: true,
                description: 'Name of the table in which to insert data to.',
            },
            {
                displayName: 'Columns',
                name: 'columns',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['insert'],
                    },
                },
                default: '',
                placeholder: 'id,name,description',
                description:
                    'Comma separated list of the properties which should used as columns for the new rows.',
            },

            // ----------------------------------
            //         update
            // ----------------------------------
            {
                displayName: 'Table',
                name: 'table',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['update'],
                    },
                },
                default: '',
                required: true,
                description: 'Name of the table in which to update data in',
            },
            {
                displayName: 'Update Key',
                name: 'updateKey',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['update'],
                    },
                },
                default: 'id',
                required: true,
                description:
                    'Name of the property which decides which rows in the database should be updated. Normally that would be "id".',
            },
            {
                displayName: 'Columns',
                name: 'columns',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['update'],
                    },
                },
                default: '',
                placeholder: 'name,description',
                description:
                    'Comma separated list of the properties which should used as columns for rows to update.',
            },

            // ----------------------------------
            //         delete
            // ----------------------------------
            {
                displayName: 'Table',
                name: 'table',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['delete'],
                    },
                },
                default: '',
                required: true,
                description: 'Name of the table in which to delete data.',
            },
            {
                displayName: 'Delete Key',
                name: 'deleteKey',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['delete'],
                    },
                },
                default: 'id',
                required: true,
                description:
                    'Name of the property which decides which rows in the database should be deleted. Normally that would be "id".',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const credentials = this.getCredentials('ibmiJdbc');

        if (credentials === undefined) {
            throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
        };

        const config = {
            host: credentials.host as string,
            user: credentials.user as string,
            password: credentials.password as string,
            prompt: 'false' as string // Daemon
        };

        const pool = jt400.pool(config);

        let returnItems: any[];
        returnItems = [];

        const items = this.getInputData();
        const operation = this.getNodeParameter('operation', 0) as string;

        try {
            if (operation === 'executeQuery') {
                // ----------------------------------
                //         executeQuery
                // ----------------------------------

                const rawQuery = this.getNodeParameter('query', 0) as string;

                try {
                    const queryResult = await pool.query(rawQuery);
                    returnItems = this.helpers.returnJsonArray(queryResult as IDataObject[]);
                }
                catch (error) {
                    pool.close();
                    throw new NodeOperationError(this.getNode(), error);
                }

            } else if (operation === 'insert') {
                // ----------------------------------
                //         insert
                // ----------------------------------
                const tables = createTableStruct(this.getNodeParameter, items);

                /*
				await executeQueryQueue(
					tables,
					({
						table,
						columnString,
						items,
					}: {
						table: string;
						columnString: string;
						items: IDataObject[];
					}): Array<Promise<object>> => {
						return chunk(items, 1000).map(insertValues => {
							const values = insertValues
								.map((item: IDataObject) => extractValues(item))
								.join(',');

							return pool
								.request()
								.query(
									`INSERT INTO ${table}(${columnString}) VALUES ${values};`,
								);
						});
					},
				);

				returnItems = items;
                */

            } else if (operation === 'update') {
                // ----------------------------------
                //         update
                // ----------------------------------
                pool.close();
                throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported!`);

            } else if (operation === 'delete') {
                // ----------------------------------
                //         delete
                // ----------------------------------
                pool.close();
                throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported!`);

            } else {
                pool.close();
                throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported!`);
            }
        } catch (error) {
            if (this.continueOnFail() === true) {
                returnItems = items;
            } else {
                pool.close();
                throw new NodeOperationError(this.getNode(), error);
            }
        }

        // Close the connection
        pool.close();

        return this.prepareOutputData(returnItems);

    }
}