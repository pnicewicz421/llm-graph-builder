import {
  Banner,
  Checkbox,
  Dialog,
  Flex,
  IconButton,
  LoadingSpinner,
  TextInput,
  TextLink,
  Typography,
} from '@neo4j-ndl/react';
import { useEffect, useState } from 'react';
import { GraphType, GraphViewModalProps, Scheme } from '../types';

import { constructDocQuery, constructQuery } from '../utils/Utils';
import {
  entities,
  chunks,
  document,
  docEntities,
  docChunks,
  chunksEntities,
  docChunkEntities,
} from '../utils/Constants';
import { ArrowSmallRightIconOutline } from '@neo4j-ndl/react/icons';
import { useCredentials } from '../context/UserCredentials';
import { calcWordColor } from '@neo4j-devtools/word-color';

const GraphViewModal: React.FunctionComponent<GraphViewModalProps> = ({
  open,
  inspectedName,
  setGraphViewOpen,
  viewPoint,
}) => {
  const [graphType, setGraphType] = useState<GraphType[]>(['Entities']);
  const [documentNo, setDocumentNo] = useState<string>('3');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<'unknown' | 'success' | 'danger'>('unknown');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [docLimit, setDocLimit] = useState<string>('3');
  const { driver } = useCredentials();

  const handleCheckboxChange = (graph: GraphType) => {
    const currentIndex = graphType.indexOf(graph);
    const newGraphSelected = [...graphType];
    if (currentIndex === -1) {
      newGraphSelected.push(graph);
    } else {
      newGraphSelected.splice(currentIndex, 1);
    }
    setGraphType(newGraphSelected);
  };

  const queryMap: {
    Document: string;
    Chunks: string;
    Entities: string;
    DocEntities: string;
    DocChunks: string;
    ChunksEntities: string;
    DocChunkEntities: string;
  } = {
    Document: document,
    Chunks: chunks,
    Entities: entities,
    DocEntities: docEntities,
    DocChunks: docChunks,
    ChunksEntities: chunksEntities,
    DocChunkEntities: docChunkEntities,
  };

  useEffect(() => {
    if (open) {
      let queryToRun = '';
      const newCheck: string =
        graphType.length === 3
          ? queryMap.DocChunkEntities
          : graphType.includes('Entities') && graphType.includes('Chunks')
          ? queryMap.ChunksEntities
          : graphType.includes('Entities') && graphType.includes('Document')
          ? queryMap.DocEntities
          : graphType.includes('Document') && graphType.includes('Chunks')
          ? queryMap.DocChunks
          : graphType.includes('Entities') && graphType.length === 1
          ? queryMap.Entities
          : graphType.includes('Chunks') && graphType.length === 1
          ? queryMap.Chunks
          : queryMap.Document;
      if (viewPoint === 'showGraphView') {
        queryToRun = constructQuery(newCheck, documentNo);
      } else {
        queryToRun = constructDocQuery(newCheck);
      }
      const session = driver?.session();
      setLoading(true);
      session
        ?.run(queryToRun, { document_name: inspectedName })
        .then((results) => {
          if (results.records && results.records.length > 0) {
            // @ts-ignore
            const neo4jNodes = results.records.map((f) => f._fields[0]);
            // @ts-ignore
            const neo4jRels = results.records.map((f) => f._fields[1]);

            // Infer color schema dynamically
            let iterator = 0;
            const schemeVal: Scheme = {};
            let labels: string[] = [];
            neo4jNodes.forEach((node) => {
              labels = node.map((f: any) => f.labels);
              labels.forEach((label: any) => {
                if (schemeVal[label] == undefined) {
                  schemeVal[label] = calcWordColor(label[0]);
                  iterator += 1;
                }
              });
            });

            setLoading(false);
          } else {
            setLoading(false);
            setStatus('danger');
            setStatusMessage('Unable to retrieve document graph for ' + inspectedName);
          }
        })
        .catch((error: any) => {
          setLoading(false);
          setStatus('danger');
          setStatusMessage(error.message);
        });
    }
  }, [open, graphType, documentNo]);

  // If the modal is closed, render nothing
  if (!open) {
    return <></>;
  }

  const headerTitle =
    viewPoint !== 'showGraphView' ? `Inspect Generated Graph from ${inspectedName}` : 'Generated Graph';


  const onClose = () => {
    setStatus('unknown');
    setStatusMessage('');
    setGraphViewOpen(false);
  };

  return (
    <>
      <Dialog
        modalProps={{
          className: 'h-[90%]',
          id: 'default-menu',
        }}
        size='unset'
        open={open}
        aria-labelledby='form-dialog-title'
        disableCloseButton={false}
        onClose={onClose}
      >
        <Dialog.Header id='form-dialog-title'>
          {headerTitle}
          <div className='flex gap-5 mt-2 justify-between'>
            <div className='flex gap-5'>
              <Checkbox
                checked={graphType.includes('Document')}
                label='Document'
                disabled={graphType.includes('Document') && graphType.length === 1}
                onChange={() => handleCheckboxChange('Document')}
              />
              <Checkbox
                checked={graphType.includes('Entities')}
                label='Entities'
                disabled={graphType.includes('Entities') && graphType.length === 1}
                onChange={() => handleCheckboxChange('Entities')}
              />
              <Checkbox
                checked={graphType.includes('Chunks')}
                label='Chunks'
                disabled={graphType.includes('Chunks') && graphType.length === 1}
                onChange={() => handleCheckboxChange('Chunks')}
              />
            </div>
            {viewPoint === 'showGraphView' && (
              <div className='flex gap-2'>
                <TextInput
                  helpText='Documents Limit'
                  required
                  type='number'
                  aria-label='Document Limit'
                  onChange={(e) => setDocLimit(e.target.value)}
                  value={docLimit}
                ></TextInput>
                <IconButton aria-label='refresh-btn' onClick={() => setDocumentNo(docLimit)}>
                  <ArrowSmallRightIconOutline className='n-size-token-7' />
                </IconButton>
              </div>
            )}
          </div>
        </Dialog.Header>
        <Dialog.Content className='n-flex n-flex-col n-gap-token-4 w-full h-[95%]'>
          <div className='bg-palette-neutral-bg-default relative h-[95%] w-full overflow-hidden'>
            {loading ? (
              <div className='my-40 flex items-center justify-center'>
                <LoadingSpinner size='large' />
              </div>
            ) : status !== 'unknown' ? (
              <div className='my-40 flex items-center justify-center'>
                <Banner
                  name='graph banner'
                  closeable
                  description={statusMessage}
                  onClose={() => setStatus('unknown')}
                  type={status}
                />
              </div>
            ) : (
              <>
                <Flex flexDirection='row' justifyContent='space-between' style={{ height: '100%', padding: '20px' }}>
                  
                  <div style={{ flex: '0.7' }}>
                    <Typography variant='h1' className='text-palette-neutral-text-default'>
                      Temporarily disabled
                    </Typography>
                    <Typography variant='body-large' className='text-palette-neutral-text-default'>
                      Graph view is temporarily disabled because of this <TextLink externalLink href='https://github.com/neo4j-labs/llm-graph-builder/issues/261'>Github issue</TextLink>. 
                      For the graph view, a private library was used which will be publicly released (very) soon.
                      Once that package is released, we will provide a fix that will switch to using the public library.
                      If you want to be notified when that happen, please subscribe to <TextLink externalLink href='https://github.com/neo4j-labs/llm-graph-builder/issues/261'>the issue on Github</TextLink>.
                    </Typography>
                  </div>
                </Flex>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
};
export default GraphViewModal;
