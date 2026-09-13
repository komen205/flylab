import numpy as np
from retina import retinal_samples
def test_black_white_and_interpolation():
    uv=np.array([[0,0],[1,1],[.5,.5]],dtype=np.float32)
    assert np.allclose(retinal_samples(np.zeros((2,2,3),dtype=np.uint8),uv),0)
    assert np.allclose(retinal_samples(np.full((2,2,3),255,dtype=np.uint8),uv),1)
    rgb=np.zeros((2,2,3),dtype=np.uint8);rgb[1,1]=255
    assert np.allclose(retinal_samples(rgb,uv),[0,1,.25])
